import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {
  CancelTestEffortRequest,
  CreateTestEffortRequest,
  Dim,
  ListAndroidBranchesRequest,
  ListAndroidBuildsRequest,
  ListAndroidSuitesRequest,
  ListAndroidTargetsRequest,
  ListAndroidTestModulesRequest,
  ListTestEffortsRequest,
  ListDriveRequest,
  ListTestPlansRequest,
  RunAndroidLabqualRequest,
  RunSuiteRequest,
  TestEffort,
  ValidateAndroidBuildRequest,
} from './satlabrpc_pb';
import {Injectable} from '@angular/core';
import {PROVISION_JOB_NAME} from 'app/constants';
import {IDims} from 'app/models/run_suite_fields';
import {getRPCHost} from 'app/utils/misc';
import {from} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AndroidService {
  private client: SatlabRpcServiceClient;

  constructor() {
    this.client = new SatlabRpcServiceClient(getRPCHost());
  }

  public listBranches(targets: string[]) {
    const req = new ListAndroidBranchesRequest().setTargetsList(targets);

    return from(
      this.client.listAndroidBranches(req, {}).then(resp => {
        return resp.getBranchesList();
      })
    );
  }

  public listTargets(branch: string) {
    const req = new ListAndroidTargetsRequest().setBranch(branch);

    return from(
      this.client.listAndroidTargets(req, {}).then(resp => {
        return resp.getTargetsList();
      })
    );
  }

  public listBuilds(board: string, branch: string, targets: string[]) {
    const req = new ListAndroidBuildsRequest()
      .setBoard(board)
      .setBranch(branch)
      .setTargetsList(targets);

    return from(
      this.client.listAndroidBuilds(req, {}).then(resp => {
        return resp.getBuildsList();
      })
    );
  }

  public listSuites(build: string, target: string) {
    const req = new ListAndroidSuitesRequest()
      .setBuildId(build)
      .setTarget(target);

    return from(
      this.client.listAndroidSuites(req, {}).then(resp => {
        return resp.getSuitesList();
      })
    );
  }

  public listTests(build: string, target: string, suite: string) {
    const req = new ListAndroidTestModulesRequest()
      .setBuildId(build)
      .setTarget(target)
      .setSuite(suite);

    return from(
      this.client.listAndroidTestModules(req, {}).then(resp => {
        return resp.getModulesList();
      })
    );
  }

  public listTestPlans() {
    const req = new ListTestPlansRequest();
    return from(
      this.client.listTestPlans(req, {}).then(resp => {
        return resp.getNamesList();
      })
    );
  }

  public listDriveXtsPaths(type: 'gts' | 'sts' = 'sts') {
    const req = new ListDriveRequest().setType(type);
    return from(
      this.client.listDrive(req, {}).then(resp => {
        return resp.getFilesList();
      })
    );
  }

  public runSuite(params: {
    buildTarget: string;
    model: string;
    build: string;
    pool: string;
    suite: string;
    targetType: string;
    testInclude: string[];
    testExclulde: string[];
    maxInShard: number;
    dims?: IDims;
  }) {
    const req = new RunSuiteRequest()
      .setAndroidDesktop(true)
      .setBuildTarget(params.buildTarget)
      .setModel(params.model)
      .setBuildVersion(params.build)
      .setCft(true)
      .setPool(params.pool)
      .setTagIncludesList([params.suite].filter(e => e.trim() !== ''))
      .setTestNameIncludesList(params.testInclude)
      .setTestNameExcludesList(params.testExclulde)
      .setTargetType(params.targetType)
      .setMaxShard(params.maxInShard)
      .setDimsList(this.toDims(params.dims));

    return from(
      this.client.runSuite(req, {}).then(resp => {
        return resp.getBuildLink();
      })
    );
  }

  public provision(params: {
    buildTarget: string;
    model: string;
    build: string;
    pool: string;
    targetType: string;
    dims: IDims;
  }) {
    return this.runSuite({
      buildTarget: params.buildTarget,
      model: params.model,
      build: params.build,
      pool: params.pool,
      suite: '',
      targetType: params.targetType,
      testInclude: [PROVISION_JOB_NAME],
      testExclulde: [],
      maxInShard: 0,
      dims: params.dims,
    });
  }

  public validateBuild(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    const req = new ValidateAndroidBuildRequest()
      .setBoard(board)
      .setBranch(branch)
      .setTargetsList(targets)
      .setBuild(build);

    return from(
      this.client.validateAndroidBuild(req, {}).then(resp => {
        return resp.getIsValid();
      })
    );
  }

  private toDims(input?: IDims) {
    if (!input) {
      return [];
    }

    return Object.keys(input).map(k => {
      return new Dim().setKey(k).setValue(input[k]);
    });
  }

  public runLabqual(
    hostname: string,
    board: string,
    model: string,
    build: string,
    firmwarePath: string,
    target: string
  ) {
    const req = new RunAndroidLabqualRequest()
      .setBoard(board)
      .setModel(model)
      .setBuild(build)
      .setHostname(hostname)
      .setTarget(target)
      .setFirmwarePath(firmwarePath);

    return from(
      this.client.runAndroidLabqual(req, {}).then(resp => resp.getLink())
    );
  }

  public listTestEfforts(pageSize: number, pageToken: string) {
    const req = new ListTestEffortsRequest()
      .setPageSize(pageSize)
      .setPageToken(pageToken);
    return from(this.client.listTestEfforts(req, {}));
  }

  public createTestEffort(params: {
    board: string;
    model: string;
    branch: string;
    target: string;
    build: string;
    testplan: string;
    pools: {
      label: string;
      type: number;
    }[];
    satlabID?: string;
    product?: string;
    testBranch?: string;
    testTarget?: string;
    testBuild?: string;
    skipBootPrerequisite?: boolean;
  }) {
    const poolLists = params.pools.map(p => {
      return new TestEffort.Pool().setLabel(p.label).setType(p.type);
    });
    const androidBuildTarget = new TestEffort.AndroidBuildTarget()
      .setBranch(params.branch)
      .setTarget(params.target)
      .setBuildId(params.build)
      .setProduct(params.product || '');

    const testEffort = new TestEffort()
      .setAndroid(androidBuildTarget)
      .setBoard(params.board)
      .setModel(params.model)
      .setSatlabId(params.satlabID || '')
      .setPoolsList(poolLists)
      .setTestplan(params.testplan)
      .setSkipBootPrerequisite(params.skipBootPrerequisite || false);

    if (params.testBranch && params.testTarget && params.testBuild) {
      const androidTestTarget = new TestEffort.AndroidBuildTarget()
        .setBranch(params.testBranch)
        .setTarget(params.testTarget)
        .setBuildId(params.testBuild);

      testEffort.setAndroidTestTarget(androidTestTarget);
    }

    const req = new CreateTestEffortRequest().setEffort(testEffort);
    return from(this.client.createTestEffort(req, {}));
  }

  public cancelTestEffort(testEffortID: string) {
    const req = new CancelTestEffortRequest().setId(testEffortID);
    return from(this.client.cancelTestEffort(req, {}));
  }
}
