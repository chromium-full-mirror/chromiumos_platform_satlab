import {IDut} from '../models/dut';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {ProvisionFields} from 'app/models/run_suite_fields';
import {AndroidService} from 'app/services/android.service';
import {Observable, of} from 'rxjs';

/**
 * run provision task on every single DUT
 * @param service the RPC service
 * @param devices the devices that we want to run a provision task
 * @param milestone the milestone that we want to run
 * @param build the build that we want to run
 * @param pool the pool that we want to filter
 */
export function runProvisionOnIndividualDUT(
  service: SatlabRpcService | AndroidService,
  device: IDut,
  fields: ProvisionFields
) {
  if (isAndroid(service)) {
    return {
      link: service.provision({
        buildTarget: device.board,
        model: device.model,
        build: fields.build,
        pool: device.pools.find(p => p.startsWith('satlab-')),
        targetType: fields.targetType,
        dims: {dut_name: device.hostname},
      }),
      hostname: device.hostname,
    };
  } else if (isChromeos(service)) {
    return {
      link: service.provision({
        model: device.model,
        board: device.board,
        milestone: fields.milestone,
        build: fields.build,
        pool: device.pools.find(p => p.startsWith('satlab-')),
        dims: {dut_name: device.hostname},
      }),
      hostname: device.hostname,
    };
  } else {
    return {
      link: of(''),
      hostname: device.hostname,
    };
  }
}

function isAndroid(
  service: AndroidService | SatlabRpcService
): service is AndroidService {
  return (service as AndroidService).listTargets !== undefined;
}

function isChromeos(
  service: AndroidService | SatlabRpcService
): service is SatlabRpcService {
  return (service as SatlabRpcService).listMilestones !== undefined;
}
