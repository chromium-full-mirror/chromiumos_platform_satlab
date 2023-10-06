import {Injectable} from '@angular/core';
import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {getRPCHost} from '../utils/misc';
import {toIterator} from '../utils/iterator';
import {
  GetDutDetailRequest,
  GetDutDetailResponse,
  ListBuildVersionsRequest,
  ListEnrolledDutsRequest,
  ListMilestonesRequest,
  RunSuiteRequest,
} from './satlabrpc_pb';
import {IDUTDetail} from '../models/dut_detail';

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

    const resp: GetDutDetailResponse = await this.client.get_dut_detail(
      req,
      {}
    );

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
    const resp = await this.client.list_enrolled_duts(req, {});

    return resp.getDutsList();
  }

  /**
   * list milestones by given model and board
   * @param p an object contains the information of model and board
   */
  public async listMilestones(p: {model: string; board: string}) {
    const req = new ListMilestonesRequest().setModel(p.model).setBoard(p.board);

    const resp = await this.client.list_milestones(req, {});

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

    const resp = await this.client.list_build_versions(req, {});

    return resp.getBuildVersionsList();
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
  }) {
    const req = new RunSuiteRequest()
      .setModel(params.model)
      .setBuildTarget(params.board)
      .setMilestone(params.milestone)
      .setBuildVersion(params.build)
      .setPool(params.pool)
      .setSuite(params.suite);

    const resp = await this.client.run_suite(req, {});

    return resp.getBuildLink();
  }
}
