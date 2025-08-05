import {Injectable} from '@angular/core';
import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {getRPCHost} from '../utils/misc';
import {UpdateDeviceRequest} from './satlabrpc_pb';
import {defer, from} from 'rxjs';

export type OSRestriction = 'ANY' | 'CHROMEOS_ONLY' | 'ANDROID_ONLY';

export type UpdateDeviceReq = {
  OSRestriction: OSRestriction;
};

@Injectable({
  providedIn: 'root',
})
export class DevicesService {
  private client: SatlabRpcServiceClient;

  constructor() {
    this.client = new SatlabRpcServiceClient(getRPCHost());
  }

  public updateDevices(hostname: string, updateReq: UpdateDeviceReq) {
    const req = new UpdateDeviceRequest()
      .setHostname(hostname)
      .setOsRestriction(updateReq.OSRestriction);

    return defer(() => from(this.client.updateDevice(req, {})));
  }
}
