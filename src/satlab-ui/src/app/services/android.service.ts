import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {
  ListAndroidBranchesRequest,
  ListAndroidBuildsRequest,
  ListAndroidSuitesRequest,
  ListAndroidTargetsRequest,
  ListAndroidTestModulesRequest,
  ListTestPlansRequest,
  RunSuiteRequest,
} from './satlabrpc_pb';
import {Injectable} from '@angular/core';
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

  public listBranches(board: string) {
    const req = new ListAndroidBranchesRequest().setBoard(board);

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
      .setMaxShard(params.maxInShard);

    return from(
      this.client.runSuite(req, {}).then(resp => {
        return resp.getBuildLink();
      })
    );
  }
}
