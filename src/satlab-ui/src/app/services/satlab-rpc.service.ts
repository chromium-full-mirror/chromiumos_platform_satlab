import {RunAndroidOSRequest, RunChromeOSRequest, Test} from 'app/models/run';
import {IAuth} from '../models/auth';
import {IBoto} from '../models/boto';
import {IDims} from '../models/dims';
import {
  IDut,
  IFirmwareDUT,
  IUpdateFirmwareResult,
  RepairDUTResponse,
} from '../models/dut';
import {IDUTDetail} from '../models/dut_detail';
import {
  IJob,
  IJobQuery,
  IJobResponse,
  JobStatus,
  JobTags,
  JobType,
  RequestStateQuery,
} from '../models/job';
import {
  IBuildSelectFields,
  ICustomSettings,
  IPVSFields,
  IQualificationsFields,
} from '../models/run_suite_fields';
import {toIterator} from '../utils/iterator';
import {getRPCHost} from '../utils/misc';
import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {
  AbortJobsRequest,
  AddDutsRequest,
  AddPoolRequest,
  AddTopologyRequest,
  AdvancedSettings,
  BotInfo,
  CheckDownloadJobLogStatusRequest,
  DeleteDutsRequest,
  DeleteTopologyRequest,
  Dim,
  DownloadJobLogRequest,
  DownloadJobLogStatus,
  DownloadLogRequest,
  Dut,
  GetCloudConfigurationRequest,
  GetDutDetailRequest,
  GetDutDetailResponse,
  GetNetworkInfoRequest,
  GetSystemInfoRequest,
  GetVersionInfoRequest,
  IsAuthRequest,
  Job,
  JobLogLinkRequest,
  ListAccessibleModelsRequest,
  ListBuildTargetsRequest,
  ListBuildVersionsRequest,
  ListConnectedDutsFirmwareRequest,
  ListDutsRequest,
  ListEnrolledDutsRequest,
  ListJobLogTasksRequest,
  ListJobsRequest,
  ListMilestonesRequest,
  ListTestPlansRequest,
  OpenCCDRequest,
  RebootRequest,
  RepairDutsRequest,
  RepairDutsResponse,
  RunLabQualRequest,
  RunQualificationRequest,
  RunRequest,
  RunStorageQualRequest,
  RunSuiteRequest,
  RunTestPlanRequest,
  RunTestRequest,
  SendMessageToCCDSessionRequest,
  SetCloudConfigurationRequest,
  SortBy,
  StableVersionRequest,
  StageBuildRequest,
  StateQuery,
  Tag,
  TestlabRequest,
  TopologyRequest,
  UpdateDutsFirmwareRequest,
  UpdatePoolRequest,
  UploadLogRequest,
  DutWifiInfoRequest,
  SetDutWifiInfoRequest,
  IsUpdateAvailableRequest,
} from './satlabrpc_pb';
import {Injectable} from '@angular/core';
import {
  DUT_STATUS_DEPLOYING,
  DUT_STATUS_NEEDS_DEPLOY,
  DUT_STATUS_NEEDS_MANUAL_REPAIR,
  DUT_STATUS_NEEDS_REPAIR,
  DUT_STATUS_NEEDS_REPLACEMENT,
  DUT_STATUS_READY,
  DUT_STATUS_REPAIRING,
  DUT_STATUS_REPAIR_FAILED,
  DUT_STATUS_RUNNING,
  DUT_STATUS_UNKNOWN,
  TESTLAB_STATUS_DISABLED,
  TESTLAB_STATUS_ENABLED,
} from 'app/constants';
import {DownloadJobTaskStatus, ITask} from 'app/models/task';
import {isCustomBuild} from 'app/utils/validators';
import {Timestamp} from 'google-protobuf/google/protobuf/timestamp_pb';
import {Moment} from 'moment';
import {from, map, of, switchMap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SatlabRpcService {
  private client: SatlabRpcServiceClient;

  constructor() {
    this.client = new SatlabRpcServiceClient(getRPCHost());
  }

  public async getDutDetail(address: string) {
    const req = new GetDutDetailRequest().setAddress(address);

    const resp: GetDutDetailResponse = await this.client.getDutDetail(req, {});

    const detail: IDUTDetail = {
      botId: resp.getBotId(),
      taskId: resp.getTaskId(),
      externalIP: resp.getExternalIp(),
      authenticatedAs: resp.getAuthenticatedAs(),
      firstSeen: resp.getFirstSeenTs()?.toDate(),
      lastSeen: resp.getLastSeenTs()?.toDate(),
      isDead: resp.getIsDead(),
      quarantined: resp.getQuarantined(),
      maintenanceMsg: resp.getMaintenanceMsg(),
      taskName: resp.getTaskName(),
      version: resp.getVersion(),
      dimensions: toIterator(resp.getDimensionsList())
        .map(e => {
          return {
            key: e.getKey(),
            values: e.getValuesList(),
          };
        })
        .collect(),
    };

    return detail;
  }

  /**
   * listEnrolledDUTs get the DUTs that have been added to the Cloud
   */
  public async listEnrolledDUTs() {
    const req = new ListEnrolledDutsRequest();
    const resp = await this.client.listEnrolledDuts(req, {});

    return toIterator(resp.getDutsList()).map(__toIDut).collect();
  }

  /**
   * list milestones by given model and board
   * @param p an object contains the information of model and board
   */
  public async listMilestones(
    p: {model: string; board: string},
    filterType?: 'firmware' | 'release'
  ) {
    const req = new ListMilestonesRequest().setModel(p.model).setBoard(p.board);

    if (filterType) {
      req.setFilterType(filterType);
    }

    const resp = await this.client.listMilestones(req, null);

    return resp.getMilestonesList();
  }

  /**
   * list build versions by given model, board, and milestone
   * @param p an object contains the information of model, board, and milestone
   */
  public async listBuilds(
    p: {
      model: string;
      board: string;
      milestone: string;
    },
    filterType?: 'firmware' | 'release'
  ) {
    const req = new ListBuildVersionsRequest()
      .setBoard(p.board)
      .setModel(p.model)
      .setMilestone(Number(p.milestone));

    if (filterType) {
      req.setFilterType(filterType);
    }

    console.log(`list build req: ${req}`);

    const resp = await this.client.listBuildVersions(req, {});

    return resp.getBuildVersionsList();
  }

  /**
   * run a runChromeOS by given model, board, milestone, build version, pool, suite,
   * and additional tags if needed.
   * @param params an object contains the required information
   */
  public async run(params: RunChromeOSRequest | RunAndroidOSRequest) {
    const settings = new AdvancedSettings();
    settings.setCft(params.advanceSettings.cft ?? false);
    settings.setTrv2(params.advanceSettings.trv2 ?? false);
    settings.setUploadToCpcon(params.advanceSettings.uploadToCpcon ?? false);
    settings.setMaxInShard(params.advanceSettings.maxInShard ?? 0);

    const servoRequired =
      (params.advanceSettings?.servoRequired as boolean) ?? false;

    const req = new RunRequest()
      .setOs(params.os)
      .setModel(params.model)
      .setBoard(params.board)
      .setBuild(params.build)
      .setPool(params.pool)
      .setDimsList(this.toDims(servoRequired, params.dims))
      .setTagIncludesList(params.tags.tagsToInclude)
      .setTagExcludesList(params.tags.tagsToExclude)
      .setTestNameIncludesList(params.tags.testNamesInclude)
      .setTestNameExcludesList(params.tags.testNamesExclude)
      .setSettings(settings);

    if (params.os === 'chromeos') {
      req.setModel(params.model).setMilestone(params.milestone);
    } else {
      req.setModel(params.model ?? '').setTarget(params.target);
    }

    switch (params.run.kind) {
      case 'suite':
        const suite = new RunRequest.Suite();
        suite.setName(params.run.name);
        req.setSuite(suite);
        break;
      case 'test':
        const test = new RunRequest.Test();
        test.setName(params.run.name);
        test.setArgs((params.run as Test).args);
        req.setTest(test);
        break;
      case 'testplan':
        const testplan = new RunRequest.Testplan();
        testplan.setName(params.run.name);
        req.setPlan(testplan);
        break;
    }
    const resp = await this.client.run(req, {});

    return resp.getLink();
  }

  /**
   * run a suite by given model, board, milestone, build version, pool, and suite.
   * @param params an object contains the required information
   */
  public async runSuite(
    params: {
      suite: string;
      customSettings: ICustomSettings;
      tagIncludes: string[];
      tagExcludes: string[];
      testNameIncludes: string[];
      testNameExcludes: string[];
    } & IBuildSelectFields
  ) {
    const servoRequired =
      (params.customSettings?.servoRequired as boolean) || false;

    const req = new RunSuiteRequest()
      .setModel(params.model)
      .setBuildTarget(params.board)
      .setMilestone(params.milestone)
      .setBuildVersion(params.build)
      .setPool(params.pool)
      .setSuite(params.suite)
      .setCft(params.customSettings.cft as boolean)
      .setTrv2(params.customSettings.trv2 as boolean)
      .setUploadToCpcon(params.customSettings.uploadToCpcon as boolean)
      .setDimsList(this.toDims(servoRequired, params.dims))
      .setTagIncludesList(params.tagIncludes)
      .setTagExcludesList(params.tagExcludes)
      .setTestNameIncludesList(params.testNameIncludes)
      .setTestNameExcludesList(params.testNameExcludes);

    const resp = await this.client.runSuite(req, {});

    return resp.getBuildLink();
  }

  /**
   * runLabQual trigger the `lab-qual` test
   */
  public runLabQual(
    params: IBuildSelectFields & {path: string; customSettings: ICustomSettings}
  ) {
    const settings = __toAdvancedSettings(params.build, params.customSettings);
    const servoRequired =
      (params.customSettings?.servoRequired as boolean) || false;

    const req = new RunLabQualRequest()
      .setBoard(params.board)
      .setModel(params.model)
      .setMilestone(params.milestone)
      .setBuild(params.build)
      .setPool(params.pool)
      .setDimsList(this.toDims(servoRequired, params.dims))
      .setSettings(settings)
      .setFirmwarePath(params.path);

    return from(this.client.runLabQual(req, {})).pipe(
      map(resp => resp.getBuildLink())
    );
  }

  /**
   * listDUTs list the DUTs that are enrolled or connected to the SatLab
   */
  public async listDUTs() {
    const req = new ListDutsRequest();

    const resp = await this.client.listDuts(req, {});

    return toIterator(resp.getDutsList()).map(__toIDut).collect();
  }

  /**
   * addPool add a pool the given DUTs
   * @param p is a structure contains the information that we want to update
   */
  public async addPool(p: {hostnames: string[]; pool: string}) {
    const req = new AddPoolRequest()
      .setPool(p.pool)
      .setHostnamesList(p.hostnames);

    await this.client.addPool(req, {});
  }

  /**
   * updatePool update the pool list to the given DUTs
   * @param p is a structure contains the information that we want to update.
   */
  public async updatePool(p: {hostname: string; pools: string[]}[]) {
    const items = toIterator(p)
      .map(elem => {
        return new UpdatePoolRequest.Item()
          .setHostname(elem.hostname)
          .setPoolsList(elem.pools);
      })
      .collect();

    const req = new UpdatePoolRequest().setItemsList(items);

    await this.client.updatePool(req, {});
  }

  /**
   * list the connected DUTs for firmware update
   */
  public async listDUTsForFirmware() {
    const req = new ListConnectedDutsFirmwareRequest();

    const resp = await this.client.listConnectedDutsFirmware(req, {});

    return toIterator(resp.getDutsList())
      .map(e => {
        const d: IFirmwareDUT = {
          address: e.getIp(),
          currentFirmware: e.getCurrentFirmware(),
          newestFirmware: e.getUpdateFirmware(),
          isLatest: e.getCurrentFirmware() === e.getUpdateFirmware(),
        };
        return d;
      })
      .collect();
  }

  /**
   * update DUTs by given an IP addresses
   * @param addresses the IP addresses of DUTs
   */
  public async updateFirmware(addresses: string[]) {
    const req = new UpdateDutsFirmwareRequest().setIpsList(addresses);

    const resp = await this.client.updateDutsFirmware(req, {});

    return toIterator(resp.getOutputsList())
      .map(e => {
        const r: IUpdateFirmwareResult = {
          address: e.getIp(),
          message: e.getCommandOutput(),
        };
        return r;
      })
      .collect();
  }

  public async getSystemInfo() {
    const req = new GetSystemInfoRequest();
    const resp = await this.client.getSystemInfo(req, null);

    return {
      cpuTemperature: Math.round(resp.getCpuTemperature() * 100) / 100,
      startTime: resp.getStartTime()?.toDate(),
    };
  }

  public async getVersionInfo() {
    const req = new GetVersionInfoRequest();
    const resp = await this.client.getVersionInfo(req, null);

    return {
      version: resp.getVersion().trim(),
      chromeosVersion: resp.getChromeosVersion().trim(),
      track: resp.getTrack().replace(/\\n+$/, '').trim(),
      description: resp.getDescription().replace(/\\n+$/, '').trim(),
      hostId: resp.getHostId().trim(),
    };
  }

  public async getNetworkInfo() {
    const req = new GetNetworkInfoRequest();
    const resp = await this.client.getNetworkInfo(req, null);

    return {
      hostname: resp.getHostname(),
      macAddress: resp.getMacAddress(),
      isConnectedToInternet: resp.getIsConnected(),
    };
  }

  /**
   * deleteDUTs delete the DUTs by given IP addresses
   * @param hostnames the hostnames we want to delete
   *
   * return an object contains the hostnames have been deleted successfully
   * or failed.
   */
  public async deleteDUTs(hostnames: string[]) {
    const req = new DeleteDutsRequest().setHostnamesList(hostnames);

    const resp = await this.client.deleteDuts(req, {});

    return {
      pass: resp.getPassList(),
      fail: resp.getFailList(),
    };
  }

  /**
   * addDUTs add the DUTs by given information
   * @param d the information of DUTs
   *
   * return an object contains the hostnames have been deleted successfully
   * or failed.
   */
  public async addDUTs(d: IDut[]) {
    const items = toIterator(d)
      .map(e => {
        const p = new AddDutsRequest.Param()
          .setModel(e.model)
          .setBoard(e.board)
          .setAddress(e.address)
          .setHostname(e.inputHostname)
          .setOs(e.hasAndroidDesktopImage ? 'android_desktop' : 'chromeos');

        if (e.isServoWiredCorrectly && e.servoSerial !== '') {
          p.setServoSerial(e.servoSerial);
        }

        return p;
      })
      .collect();

    const req = new AddDutsRequest().setDutsList(items);

    const resp = await this.client.addDuts(req, {});

    return {
      pass: toIterator(resp.getPassList())
        .map(e => {
          return {
            hostname: e.getHostname(),
            url: e.getUrl(),
          };
        })
        .collect(),
      fail: toIterator(resp.getFailList())
        .map(e => {
          return {
            hostname: e.getHostname(),
            reason: e.getReason(),
          };
        })
        .collect(),
    };
  }

  /**
   * run a test by given model, board, milestone, build version, pool, test, and test_args.
   * @param params an object contains the required information
   */
  public async runTest(
    params: {
      tests: string[];
      test_args?: string;
      customSettings: ICustomSettings;
    } & IBuildSelectFields
  ) {
    const servoRequired =
      (params.customSettings?.servoRequired as boolean) || false;

    const req = new RunTestRequest()
      .setModel(params.model)
      .setBoard(params.board)
      .setMilestone(params.milestone)
      .setBuild(params.build)
      .setPool(params.pool)
      .setTestsList(params.tests)
      .setCft(params.customSettings.cft as boolean)
      .setTrv2(params.customSettings.trv2 as boolean)
      .setUploadToCpcon(params.customSettings.uploadToCpcon as boolean)
      .setDimsList(this.toDims(servoRequired, params.dims));

    if (params.test_args !== undefined) {
      req.setTestArgs(params.test_args);
    }
    const resp = await this.client.runTest(req, {});
    return resp.getBuildLink();
  }

  /**
   * run a provision test on the DUTs that fit the parameters
   * @param params an object contains the information that we want to run on some DUTs
   */
  public async provision(params: {
    model: string;
    board: string;
    milestone: string;
    build: string;
    pool: string;
    dims?: IDims;
  }) {
    return this.runTest({
      ...params,
      customSettings: {
        cft: !isCustomBuild(params.build),
        trv2: false,
        uploadToCpcon: false,
      },
      tests: ['stub_Pass'],
    });
  }

  /**
   * list testplans fetch the names of testplans from bucket
   */
  public async listTestPlans(): Promise<string[]> {
    const req = new ListTestPlansRequest();
    const resp = await this.client.listTestPlans(req, {});

    return resp.getNamesList();
  }

  /**
   * run a testplan by given model, board, milestone, build, pool and testplan
   * @param params object with required information
   */
  public async runTestPlan(
    params: {
      plan: string;
      customSettings: ICustomSettings;
    } & IBuildSelectFields
  ) {
    const servoRequired =
      (params.customSettings?.servoRequired as boolean) || false;

    const req = new RunTestPlanRequest()
      .setModel(params.model)
      .setBoard(params.board)
      .setMilestone(params.milestone)
      .setBuild(params.build)
      .setPool(params.pool)
      .setTestPlanName(params.plan)
      .setCft(params.customSettings.cft as boolean)
      .setTrv2(params.customSettings.trv2 as boolean)
      .setUploadToCpcon(params.customSettings.uploadToCpcon as boolean)
      .setDimsList(this.toDims(servoRequired, params.dims));

    const resp = await this.client.runTestPlan(req, {});

    return resp.getBuildLink();
  }

  /**
   * Setup SatLab cloud configuration
   * @param b the parameters of boto (boto_key, boto_secret, bucket_name)
   */
  public async setCloudConfiguration(b: IBoto) {
    const req = new SetCloudConfigurationRequest()
      .setBotoKeyId(b.key)
      .setBotoKeySecret(b.secret)
      .setGcsBucketUrl(b.bucket);

    await this.client.setCloudConfiguration(req, {});

    return true;
  }

  /**
   * Get cloud configuration
   */
  public async getCloudConfiguration(): Promise<IBoto> {
    const req = new GetCloudConfigurationRequest();

    const resp = await this.client.getCloudConfiguration(req, {});

    return {
      key: resp.getBotoKeyId(),
      bucket: resp.getGcsBucketUrl(),
      secret: 'secret',
    };
  }

  /**
   * Check if service account is existed
   */
  public async isAuth(): Promise<IAuth> {
    const req = new IsAuthRequest();

    const resp = await this.client.isAuth(req, {});

    return {
      isAuth: resp.getIsAuth(),
    };
  }

  /**
   * list all boards, return the board list
   */
  public async listBoards() {
    const req = new ListBuildTargetsRequest();

    const resp = await this.client.listBuildTargets(req, {});

    return resp.getBuildTargetsList();
  }

  /**
   * list all models. return the model list
   * @param board
   */
  public async listModels(board: string) {
    const req = new ListAccessibleModelsRequest().setBoard(board);

    const resp = await this.client.listAccessibleModels(req, {});

    return toIterator(resp.getModelsList())
      .map(e => e.getName())
      .collect();
  }

  /**
   * stage a build in the partner bucket
   * @param f
   */
  public stageBuild(
    f: {board: string; model: string; build: string},
    filterType?: 'firmware' | 'release'
  ) {
    const req = new StageBuildRequest()
      .setBoard(f.board)
      .setModel(f.model)
      .setBuildVersion(f.build);

    if (filterType) {
      req.setFilterType(filterType);
    }

    return from(this.client.stageBuild(req, {})).pipe(
      map(resp => {
        return {
          bucket: resp.getBuildBucket(),
          path: resp.getPath(),
        };
      })
    );
  }

  /**
   * reboot the system
   */
  public async reboot() {
    const req = new RebootRequest();

    await this.client.reboot(req, {});
  }

  /**
   * repairDuts repair DUTs by hostnames.
   * @param p: The object of hostnames and the flag which indicates deep repair or not.
   */
  public async repairDuts(p: {hostnames: string[]; deep: boolean}) {
    const req = new RepairDutsRequest()
      .setHostnamesList(p.hostnames)
      .setDeep(p.deep);

    const resp = await this.client.repairDuts(req, {});

    return toRepairDUTsResponse(resp.getResultList());
  }

  /** list jobs by query
   * @param q the parameters that we want to filter.
   */
  public async listJobs(q: IJobQuery): Promise<IJobResponse> {
    console.log(q);
    const req = new ListJobsRequest();

    if (q.createdDateGt) {
      req.setCreatedTimeGt(Timestamp.fromDate(q.createdDateGt.toDate()));
    }
    if (q.createdDateLt) {
      req.setCreatedTimeLt(Timestamp.fromDate(q.createdDateLt.toDate()));
    }
    req.setJobType(toRequestJobType(q.jobType));
    req.setQueryStatus(toRequestJobStatus(q.statusQuery));
    if (q.pageToken) {
      req.setPageToken(q.pageToken);
    }
    // TODO: the UI does not support let a user to decide which ordering.
    req.setSortBy(SortBy.CREATED_TS);
    req.setLimit(q.pageSize);

    req.setTagsList(toTags(q.tags));

    const resp = await this.client.listJobs(req, {});

    return {
      token: resp.getNextPageToken(),
      jobs: toIterator(resp.getJobsList()).map(toJob).collect(),
    };
  }

  /** Run a storage qualification suite by specify the bug_id.
   * @param params the basic parameters with bug_id
   */
  public async runStorageQualification(
    params: IBuildSelectFields &
      IPVSFields & {test: string; suite: string} & {
        customSettings?: ICustomSettings;
      }
  ) {
    const servoRequired =
      (params.customSettings?.servoRequired as boolean) || false;

    const req = new RunStorageQualRequest()
      .setBoard(params.board)
      .setModel(params.model)
      .setMilestone(params.milestone)
      .setBuild(params.build)
      .setBugId(params.bugID)
      .setPool(params.pool)
      .setSuite(params.suite)
      .setTest(params.test)
      .setDimsList(this.toDims(servoRequired, params.dims));

    const res = await this.client.runStorageQual(req, {});

    return res.getBuildLink();
  }

  public async runQualification(
    params: IBuildSelectFields &
      IQualificationsFields & {customSettings?: ICustomSettings}
  ) {
    const servoRequired =
      (params.customSettings?.servoRequired as boolean) || false;

    const req = new RunQualificationRequest()
      .setBoard(params.board)
      .setModel(params.model)
      .setMilestone(params.milestone)
      .setVersion(params.build)
      .setQualificationId(params.bugID)
      .setPool(params.pool)
      .setCentralizedSuite(params.suite)
      .setDimsList(this.toDims(servoRequired, params.dims))
      .setIsIncrementalRun(params.isIncrementalRun);

    const res = await this.client.runQualification(req, {});

    return res.getBuildLink();
  }

  /**
   * upload logs to partner bucket
   */
  public async uploadLog() {
    const req = new UploadLogRequest();

    const resp = await this.client.uploadLog(req, {});

    return resp.getBucketLink();
  }

  /**
   * download logs to local
   */
  public downloadLog(p: {
    onSuccess: (blob: Blob) => void;
    onError: (e: unknown) => void;
    finalize: () => void;
  }) {
    const bytes = [];
    const req = new DownloadLogRequest();
    this.client
      .downloadLog(req, {})
      .on('error', e => {
        p.onError(e);
        p.finalize();
      })
      .on('data', resp => bytes.push(resp.getFileChunk_asU8()))
      .on('end', () => {
        p.onSuccess(
          new Blob([...bytes], {
            type: 'application/x-download',
          })
        );
        p.finalize();
      });
  }

  public async abort(params: {
    ids: string[];
    type: JobType;
    timeGt?: Moment;
    timeLt?: Moment;
  }) {
    const req = new AbortJobsRequest();

    if (params.timeGt) {
      req.setCreatedTimeGt(Timestamp.fromDate(params.timeGt.toDate()));
    }
    if (params.timeLt) {
      req.setCreatedTimeLt(Timestamp.fromDate(params.timeLt.toDate()));
    }
    req.setIdsList(params.ids);
    req.setJobType(toRequestJobType(params.type));

    await this.client.abortJobs(req, {});
  }

  public openCCD(p: {
    servoSerial: string;
    rmaAuth: boolean;
    onData: (data: string) => void;
    onError: (e: unknown) => void;
    finalize: () => void;
  }) {
    const req = new OpenCCDRequest()
      .setServoSerial(p.servoSerial)
      .setRmaAuth(p.rmaAuth);

    const stream = this.client
      .openCCD(req, {})
      .on('error', e => p.onError(e))
      .on('data', resp => p.onData(resp.getMessage()))
      .on('end', () => p.finalize());

    return stream;
  }

  public sendMessageToCCDSession(p: {servoSerial: string; message: string}) {
    const req = new SendMessageToCCDSessionRequest()
      .setServoSerial(p.servoSerial)
      .setMessage(p.message);

    this.client.sendMessageToCCDSession(req, {});
  }

  private toDims(servoRequired: boolean, input?: IDims) {
    const values = {...input};

    if (servoRequired) {
      values['label-servo_state'] = 'WORKING';
    }

    return Object.entries(values).map(([k, v]) => {
      return new Dim().setKey(k).setValue(v);
    });
  }

  public getStableVersion(p: {board: string; model: string}) {
    return of(p).pipe(
      map(e => {
        return new StableVersionRequest().setBoard(e.board).setModel(e.model);
      }),
      switchMap(req => from(this.client.stableVersion(req, {}))),
      map(resp => {
        return {
          board: p.board,
          model: p.model,
          osImage: resp.getOsImage(),
          fwVersion: resp.getFwVersion(),
          fwImage: resp.getFwImage(),
        };
      })
    );
  }

  public async getTopology(hostname: string) {
    const req = new TopologyRequest().setHostname(hostname);
    const res = await this.client.topology(req, {});
    return res.getPasitHost();
  }

  public async addTopology(params: {hostname: string; content: string}) {
    const req = new AddTopologyRequest()
      .setHostname(params.hostname)
      .setContent(params.content);
    return await this.client.addTopology(req, {});
  }

  public async deleteTopology(hostname: string) {
    const req = new DeleteTopologyRequest().setHostname(hostname);

    return await this.client.deleteTopology(req, {});
  }

  public async getTestlabEnabled(ip: string) {
    const req = new TestlabRequest().setIpAddress(ip);
    const res = await this.client.testlab(req, {});
    return __toTestlabStatus(res.getEnabled());
  }

  public async getDUTWifiInfo() {
    const req = new DutWifiInfoRequest();
    const res = await this.client.dutWifiInfo(req, {});

    return {
      ssid: res.getSsid(),
      password: res.getPassword(),
    };
  }

  public async setDUTWifiInfo(p: {ssid: string; password: string}) {
    const req = new SetDutWifiInfoRequest()
      .setSsid(p.ssid)
      .setPassword(p.password);

    await this.client.setDutWifiInfo(req, {});
  }

  public async isUpdateAvailable() {
    const req = new IsUpdateAvailableRequest();
    const resp = await this.client.isUpdateAvailable(req, {});

    return resp.getIsUpdateAvailable();
  }

  public async downloadJob(id: string) {
    const req = new DownloadJobLogRequest().setId(id);
    const res = await this.client.downloadJobLog(req, {});

    return res.getTaskId();
  }

  public async checkDownloadJobLogStatus(task_id: string) {
    const req = new CheckDownloadJobLogStatusRequest().setTaskId(task_id);
    const res = await this.client.checkDownloadJobLogStatus(req, {});

    return {
      status: toDownloadJobLogStatus(res.getStatus()),
      errMsg: res.getErrorMessage(),
    };
  }

  public async jobLogLink(task_id: string) {
    const req = new JobLogLinkRequest().setTaskId(task_id);
    const res = await this.client.jobLogLink(req, {});

    return res.getLink();
  }

  public async listJobLogTasks() {
    const req = new ListJobLogTasksRequest();
    const res = await this.client.listJobLogTasks(req, {});

    return res.getTasksList().map(task => ({
      id: task.getId(),
      status: toDownloadJobLogStatus(task.getStatus()),
    }));
  }
}

function toDownloadJobLogStatus(DownloadJobTaskStatus): DownloadJobTaskStatus {
  if (DownloadJobTaskStatus === DownloadJobLogStatus.DOWNLOADING) {
    return 'DOWNLOADING';
  } else if (DownloadJobTaskStatus === DownloadJobLogStatus.ZIPPING) {
    return 'ZIPPING';
  } else if (DownloadJobTaskStatus === DownloadJobLogStatus.UPLOADING) {
    return 'UPLOADING';
  } else if (DownloadJobTaskStatus === DownloadJobLogStatus.COMPLETED) {
    return 'COMPLETED';
  } else if (DownloadJobTaskStatus === DownloadJobLogStatus.FAILED) {
    return 'FAILED';
  }
  return 'PENDING';
}

function toRepairDUTsResponse(r: RepairDutsResponse.RepairResult[]) {
  return toIterator(r)
    .map(e => {
      const res: RepairDUTResponse = {
        hostname: e.getHostname(),
        buildLink: e.getBuildLink(),
        taskLink: e.getTaskLink(),
        isSuccess: e.getIsSuccess(),
      };
      return res;
    })
    .collect();
}

function toTags(tags?: JobTags): Tag[] {
  return tags
    ? toIterator(Object.keys(tags))
        .map(k => {
          return new Tag().setKey(k).setValue(tags[k]);
        })
        .collect()
    : [];
}

function toJob(j: Job): IJob {
  const childStatus = j.getChildStatusCount()?.getTaskCountList() ?? [];
  let complete: undefined | number = undefined;
  if (childStatus.length === 2) {
    const all = toIterator(childStatus).first_where(
      e => e.getState() === StateQuery.QUERY_ALL
    );
    const running = toIterator(childStatus).first_where(
      e => e.getState() === StateQuery.QUERY_PENDING_RUNNING
    );

    if (all && all.getCount() === 0) {
      complete = 0;
    } else if (all && running) {
      complete = (all.getCount() - running.getCount()) / all.getCount();
    }
  }

  return {
    id: j.getJobId(),
    name: j.getName(),
    board: j.getBoard(),
    model: j.getModel(),
    build: j.getBuild(),
    createdAt: j.getCreatedTime().toDate(),
    startedAt: j.getStartTime()?.toDate(),
    finishedAt: j.getFinishedTime()?.toDate(),
    parentJobID: j.getParentJobId(),
    hostname: j.getHostname(),
    pool: j.getLabelPool(),
    satlabID: j.getSatlabId(),
    status: toJobStatus(j.getStatus()),
    taskUrl: j.getTaskUrl(),
    resultUrl: j.getResultsUrl(),
    cpconUrl: j.getCpconUrl(),
    completeJobPercentage: complete,
  };
}

function toJobStatus(s: Job.JobStatus): JobStatus {
  switch (s) {
    case Job.JobStatus.PENDING:
      return 'PENDING';
    case Job.JobStatus.RUNNING:
      return 'RUNNING';
    case Job.JobStatus.COMPLETE:
    case Job.JobStatus.COMPLETE_SUCCESS:
    case Job.JobStatus.COMPLETE_FAILURE:
      return 'COMPLETE';
    case Job.JobStatus.TIMED_OUT:
      return 'TIMEOUT';
    case Job.JobStatus.EXPIRED:
      return 'EXPIRED';
    case Job.JobStatus.ABORTED:
      return 'ABORTED';
    default:
      return 'STATUS_NOT_SET';
  }
}

function toRequestJobType(t?: JobType) {
  switch (t) {
    case 'SUITE':
      return Job.JobType.SUITE;
    case 'TESTPLAN':
      return Job.JobType.TESTPLAN;
    case 'TEST':
      return Job.JobType.TEST;
    default:
      return Job.JobType.TYPE_NOT_SET;
  }
}

function toRequestJobStatus(s?: RequestStateQuery) {
  switch (s) {
    case 'PENDING':
      return StateQuery.QUERY_PENDING;
    case 'RUNNING':
      return StateQuery.QUERY_RUNNING;
    case 'PENDING_RUNNING':
      return StateQuery.QUERY_PENDING_RUNNING;
    case 'COMPLETED':
      return StateQuery.QUERY_COMPLETED;
    case 'EXPIRED':
      return StateQuery.QUERY_EXPIRED;
    case 'TIMEOUT':
      return StateQuery.QUERY_TIMED_OUT;
    case 'CANCELLED':
      return StateQuery.QUERY_CANCELED;
    default:
      return StateQuery.QUERY_ALL;
  }
}

function __toStatusHintText(status: string) {
  if (status === DUT_STATUS_UNKNOWN) {
    return 'DUT is enrolling. If the task runs longer than 30 mins, please un-enroll and re-enroll it again';
  } else if (status === DUT_STATUS_READY) {
    return 'Ready for testing';
  } else if (status === DUT_STATUS_NEEDS_REPAIR) {
    return 'DUT is either running test or is going to be picked up by auto-repair';
  } else if (status === DUT_STATUS_REPAIR_FAILED) {
    return 'Auto-repair will continue to attempt repairs';
  } else if (status === DUT_STATUS_NEEDS_DEPLOY) {
    return 'Please Unenroll, then Enroll DUT';
  } else if (status === DUT_STATUS_NEEDS_MANUAL_REPAIR) {
    return 'Please menually repair the dut, Auto-repair is not be fix it';
  } else if (status === DUT_STATUS_NEEDS_REPLACEMENT) {
    return 'Hardware issues found, please unenroll and replace DUT';
  } else if (status === DUT_STATUS_RUNNING) {
    return 'DUT is running a task';
  } else if (status === DUT_STATUS_REPAIRING) {
    return 'DUT is repairing';
  } else if (status === DUT_STATUS_DEPLOYING) {
    return 'DUT is deploying';
  } else {
    return '';
  }
}

/**
 * __toIDut is a parser to parse the proto class to an interface `IDut`
 * @param e is the class of DUT in proto file.
 */
function __toIDut(e: Dut) {
  const status = __toStatus(e.getState(), e.getBotInfo());
  const dut: IDut = {
    address: e.getAddress(),
    name: e.getName(),
    hostname: e.getHostname(),
    board: e.getBoard(),
    model: e.getModel(),
    pools: e.getPoolsList(),
    poolString: e.getPoolsList().join(', '),
    mac: e.getMacAddress(),
    servoSerial: e.getServoSerial(),
    isConnected:
      e.getIsPingable() &&
      (e.getHasTestImage() || e.getHasAndroidDesktopImage()),
    hasAndroidDesktopImage: e.getHasAndroidDesktopImage(),
    hasTestImage: e.getHasTestImage(),
    isAccessible: !(
      e.getHostname() === '' &&
      !(
        e.getIsPingable() &&
        (e.getHasTestImage() || e.getHasAndroidDesktopImage())
      )
    ),
    status: status,
    isServoWiredCorrectly:
      e.getServoSerial() === '' || e.getServoSerial() !== 'NOT DETECTED',
    statusHintText: __toStatusHintText(status),
    ccdStatus: e.getCcdStatus(),
    dimensions: toIterator(e.getBotInfo()?.getDimensionsList() ?? []).fold(
      {},
      (prev, elem) => {
        prev[elem.getKey()] = elem.getValuesList();
        return prev;
      }
    ),
    hasPermission: e.getHasPermission(),
    testlabEnabled: '',
  };

  return dut;
}

/**
 * Convert DUT status.
 * if bot status is busy, and task name is not empty, we
 * return the task name. Otherwise, we return dut status.
 * @param status the DUT status
 * @param botInfo  the DUT bot information
 *
 * @returns either DUT status or task name
 */
function __toStatus(status: string, botInfo?: BotInfo) {
  return botInfo &&
    botInfo.getBotState() === BotInfo.BotState.BUSY &&
    botInfo.getTaskName() !== ''
    ? botInfo.getTaskName().toLowerCase()
    : status;
}

/**
 * Convert the `ICustomSettings` to the proto message `AdvancedSettings`
 * @param build the build version that user selected
 * @param settings the type of ICustomSettings
 *
 * @returns the proto message AdvancedSettings
 */
function __toAdvancedSettings(build: string, settings: ICustomSettings) {
  const isCustom = isCustomBuild(build);
  const cft = settings.cft && !isCustom;
  const trv2 = settings.trv2 && !isCustom;
  const uploadToCpcon =
    (settings.trv2 as boolean) && (settings.uploadToCpcon as boolean);

  return new AdvancedSettings()
    .setCft(cft)
    .setTrv2(trv2)
    .setUploadToCpcon(uploadToCpcon);
}

function __toTestlabStatus(status: boolean) {
  if (status) {
    return TESTLAB_STATUS_ENABLED;
  }
  return TESTLAB_STATUS_DISABLED;
}
