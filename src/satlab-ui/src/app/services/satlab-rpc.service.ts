import {Injectable} from '@angular/core';
import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {getRPCHost} from '../utils/misc';
import {toIterator} from '../utils/iterator';
import {
  AddPoolRequest,
  Dut,
  GetDutDetailRequest,
  GetDutDetailResponse,
  ListBuildVersionsRequest,
  ListConnectedDutsFirmwareRequest,
  ListDutsRequest,
  ListEnrolledDutsRequest,
  ListMilestonesRequest,
  ListTestPlansRequest,
  RunSuiteRequest,
  UpdateDutsFirmwareRequest,
  UpdatePoolRequest,
  GetSystemInfoRequest,
  GetVersionInfoRequest,
  GetNetworkInfoRequest,
  DeleteDutsRequest,
  AddDutsRequest,
  RunTestRequest,
  RunTestPlanRequest,
  SetCloudConfigurationRequest,
  GetCloudConfigurationRequest,
  ListBuildTargetsRequest,
  ListAccessibleModelsRequest,
  StageBuildRequest,
  RebootRequest,
  Dim,
  RepairDutsRequest,
  RepairDutsResponse,
} from './satlabrpc_pb';
import {IDUTDetail} from '../models/dut_detail';
import {
  IDut,
  IFirmwareDUT,
  IUpdateFirmwareResult,
  RepairDUTResponse,
} from '../models/dut';
import {IBoto} from '../models/boto';
import {IDims} from '../models/dims';
import {
  DUT_STATUS_NEEDS_DEPLOY,
  DUT_STATUS_NEEDS_MANUAL_REPAIR,
  DUT_STATUS_NEEDS_REPAIR,
  DUT_STATUS_NEEDS_REPLACEMENT,
  DUT_STATUS_READY,
  DUT_STATUS_REPAIR_FAILED,
  DUT_STATUS_UNKNOWN,
} from 'app/constants';

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

    return toIterator(resp.getDutsList()).map(this.__toIDut).collect();
  }

  /**
   * list milestones by given model and board
   * @param p an object contains the information of model and board
   */
  public async listMilestones(p: {model: string; board: string}) {
    const req = new ListMilestonesRequest().setModel(p.model).setBoard(p.board);

    const resp = await this.client.listMilestones(req, {});

    return resp.getMilestonesList();
  }

  /**
   * list build versions by given model, board, and milestone
   * @param p an object contains the information of model, board, and milestone
   */
  public async listBuilds(p: {
    model: string;
    board: string;
    milestone: string;
  }) {
    const req = new ListBuildVersionsRequest()
      .setBoard(p.board)
      .setModel(p.model)
      .setMilestone(Number(p.milestone));

    const resp = await this.client.listBuildVersions(req, {});

    return resp.getBuildVersionsList();
  }

  private toDims(input?: IDims) {
    if (!input) {
      return [];
    }

    return Object.keys(input).map(k => {
      return new Dim().setKey(k).setValue(input[k]);
    });
  }

  /**
   * run a suite by given model, board, milestone, build version, pool, and suite.
   * @param params an object contains the required information
   */
  public async runSuite(params: {
    model: string;
    board: string;
    milestone: string;
    build: string;
    pool: string;
    suite: string;
    dims?: IDims;
  }) {
    const req = new RunSuiteRequest()
      .setModel(params.model)
      .setBuildTarget(params.board)
      .setMilestone(params.milestone)
      .setBuildVersion(params.build)
      .setPool(params.pool)
      .setSuite(params.suite)
      .setDimsList(this.toDims(params.dims));

    const resp = await this.client.runSuite(req, {});

    return resp.getBuildLink();
  }

  /**
   * listDUTs list the DUTs that are enrolled or connected to the SatLab
   */
  public async listDUTs() {
    const req = new ListDutsRequest();

    const resp = await this.client.listDuts(req, {});

    return toIterator(resp.getDutsList()).map(this.__toIDut).collect();
  }

  /**
   * __toIDut is a parser to parse the proto class to an interface `IDut`
   * @param e is the class of DUT in proto file.
   * @private
   */
  private __toIDut(e: Dut) {
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
      isConnected: e.getIsPingable() && e.getHasTestImage(),
      isAccessible: !(
        e.getHostname() === '' && !(e.getIsPingable() && e.getHasTestImage())
      ),
      status: e.getState(),
      isServoWiredCorrectly:
        e.getServoSerial() === '' || e.getServoSerial() !== 'NOT DETECTED',
      statusHintText: __toStatusHintText(e.getState()),
    };

    return dut;
  }

  /**
   * addPool add a pool the given DUTs
   * @param p is a structure contains the information that we want to update
   */
  public async addPool(p: {addresses: string[]; pool: string}) {
    const req = new AddPoolRequest()
      .setPool(p.pool)
      .setAddressesList(p.addresses);

    await this.client.addPool(req, {});
  }

  /**
   * updatePool update the pool list to the given DUTs
   * @param p is a structure contains the information that we want to update.
   */
  public async updatePool(p: {address: string; pools: string[]}[]) {
    const items = toIterator(p)
      .map(elem => {
        return new UpdatePoolRequest.Item()
          .setAddress(elem.address)
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
          .setHostname(e.inputHostname);

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
  public async runTest(params: {
    model: string;
    board: string;
    milestone: string;
    build: string;
    pool: string;
    tests: string[];
    test_args?: string;
    dims?: IDims;
  }) {
    const req = new RunTestRequest()
      .setModel(params.model)
      .setBoard(params.board)
      .setMilestone(params.milestone)
      .setBuild(params.build)
      .setPool(params.pool)
      .setTestsList(params.tests)
      .setDimsList(this.toDims(params.dims));

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
  public async runTestPlan(params: {
    model: string;
    board: string;
    milestone: string;
    build: string;
    pool: string;
    plan: string;
    dims?: IDims;
  }) {
    const req = new RunTestPlanRequest()
      .setModel(params.model)
      .setBoard(params.board)
      .setMilestone(params.milestone)
      .setBuild(params.build)
      .setPool(params.pool)
      .setTestPlanName(params.plan)
      .setDimsList(this.toDims(params.dims));

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
  public async stageBuild(f: {board: string; model: string; build: string}) {
    const req = new StageBuildRequest()
      .setBoard(f.board)
      .setModel(f.model)
      .setBuildVersion(f.build);

    const resp = await this.client.stageBuild(req, {});

    return resp.getBuildBucket();
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

function __toStatusHintText(status: string) {
  if (status === DUT_STATUS_UNKNOWN) {
    return 'Please enroll DUT then wait for the deploy task to finish';
  } else if (status === DUT_STATUS_READY) {
    return 'Ready for testing';
  } else if (status === DUT_STATUS_NEEDS_REPAIR) {
    return 'DUT will auto-repair, please wait';
  } else if (status === DUT_STATUS_REPAIR_FAILED) {
    return 'Auto-repair will continue to attempt repairs';
  } else if (status === DUT_STATUS_NEEDS_DEPLOY) {
    return 'Please Unenroll, then Enroll DUT';
  } else if (status === DUT_STATUS_NEEDS_MANUAL_REPAIR) {
    return 'Please menually repair the dut, Auto-repair is not be fix it';
  } else if (status === DUT_STATUS_NEEDS_REPLACEMENT) {
    return 'Hardware issues found, please unenroll and replace DUT';
  } else {
    return '';
  }
}
