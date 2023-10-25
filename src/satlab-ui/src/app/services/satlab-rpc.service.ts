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
  RunSuiteRequest,
  UpdateDutsFirmwareRequest,
  UpdatePoolRequest,
  GetSystemInfoRequest,
  GetVersionInfoRequest,
  GetNetworkInfoRequest,
  DeleteDutsRequest,
} from './satlabrpc_pb';
import {IDUTDetail} from '../models/dut_detail';
import {IDut, IFirmwareDUT, IUpdateFirmwareResult} from "../models/dut";

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
  public async listMilestones(p: { model: string; board: string }) {
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

  /**
   * listDUTs list the DUTs that are enrolled or connected to the SatLab
   */
  public async listDUTs() {
    const req = new ListDutsRequest();

    const resp = await this.client.list_duts(req, {});

    return toIterator(resp.getDutsList()).map(this.__toIDut).collect();
  }

  /**
   * __toIDut is a parser to parse the proto class to an interface `IDut`
   * @param e is the class of DUT in proto file.
   * @private
   */
  private __toIDut(e: Dut) {
    const n = e.getHostname().split("-")
    let hostname = e.getHostname()
    if (n.length >= 3) {
      hostname = n.slice(2).join("-")
    }
    const dut: IDut = {
      address: e.getAddress(),
      name: e.getName(),
      hostname: e.getHostname(),
      hostnameNoPrefix: hostname,
      board: e.getBoard(),
      model: e.getModel(),
      pools: e.getPoolsList(),
      poolString: e.getPoolsList().join(', '),
      mac: e.getMacAddress(),
      servoSerial: e.getServoSerial(),
      isConnected: e.getIsConnected(),
      isAccessible: !(e.getHostname() == '' && !e.getIsConnected())
    }

    return dut
  }

  /**
   * addPool add a pool the given DUTs
   * @param p is a structure contains the information that we want to update
   */
  public async addPool(p: { addresses: string[], pool: string }) {
    const req = new AddPoolRequest()
      .setPool(p.pool)
      .setAddressesList(p.addresses);

    await this.client.add_pool(req, {});
  }

  /**
   * updatePool update the pool list to the given DUTs
   * @param p is a structure contains the information that we want to update.
   */
  public async updatePool(p: { address: string, pools: string[] }[]) {
    const items = toIterator(p)
      .map(elem => {
        return new UpdatePoolRequest.Item()
          .setAddress(elem.address)
          .setPoolsList(elem.pools);
      })
      .collect();

    const req = new UpdatePoolRequest().setItemsList(items);

    await this.client.update_pool(req, {});
  }

  /**
   * list the connected DUTs for firmware update
   */
  public async listDUTsForFirmware() {
    const req = new ListConnectedDutsFirmwareRequest()

    const resp = await this.client.list_connected_duts_firmware(req, {})

    return toIterator(resp.getDutsList())
      .map(e => {
        const d: IFirmwareDUT = {
          address: e.getIp(),
          currentFirmware: e.getCurrentFirmware(),
          newestFirmware: e.getUpdateFirmware(),
        }
        return d
      })
      .collect();
  }

  /**
   * update DUTs by given an IP addresses
   * @param addresses the IP addresses of DUTs
   */
  public async updateFirmware(addresses: string[]) {
    const req = new UpdateDutsFirmwareRequest()
      .setIpsList(addresses);

    const resp = await this.client.update_duts_firmware(req, {});

    return toIterator(resp.getOutputsList())
      .map(e => {
        const r: IUpdateFirmwareResult = {
          address: e.getIp(),
          message: e.getCommandOutput(),
        }
        return r;
      })
      .collect();
  }

  public async getSystemInfo() {
    const req = new GetSystemInfoRequest();
    const resp = await this.client.get_system_info(req, null);

    return {
      cpuTemperature: Math.round(resp.getCpuTemperature() * 100) / 100,
      startTime: resp.getStartTime()?.toDate(),
    };
  }

  public async getVersionInfo() {
    const req = new GetVersionInfoRequest();
    const resp = await this.client.get_version_info(req, null);

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
    const resp = await this.client.get_network_info(req, null);

    return {
      hostname: resp.getHostname(),
      macAddress: resp.getMacAddress(),
      isConnectedToInternet: resp.getIsConnected(),
    };
  }

  /**
   * deleteDUTs delete the DUTs by given IP addresses
   *
   * return an object contains the hostnames have been deleted successfully
   * or failed.
   */
  public async deleteDUTs(addresses: string[]) {
    const req = new DeleteDutsRequest()
      .setAddressesList(addresses);
    const resp = await this.client.delete_duts(req, {});

    return {
      pass: resp.getPassList(),
      fail: resp.getFailList(),
    }
  }
}
