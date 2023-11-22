import {IDut} from '../models/dut';
import {toIterator} from './iterator';
import {SatlabRpcService} from '../services/satlab-rpc.service';

/**
 * run provision task on every single DUT
 * @param service the RPC service
 * @param devices the devices that we want to run a provision task
 * @param milestone the milestone that we want to run
 * @param build the build that we want to run
 * @param pool the pool that we want to filter
 */
export async function runProvisionOnIndividualDUT(
  service: SatlabRpcService,
  devices: IDut[],
  milestone: string,
  build: string,
  pool: string
) {
  const ds = toIterator(devices)
    .filter(e => e.hostname !== '')
    .filter(e => e.pools.includes(pool))
    .collect();

  if (ds.length === 0) {
    return [];
  }

  return toIterator(ds)
    .map(async item => {
      try {
        return {
          hostname: item.hostname,
          link: await service.provision({
            model: item.model,
            board: item.board,
            milestone: milestone,
            build: build,
            pool: pool,
            dims: {
              dut_name: item.hostname,
            },
          }),
        };
      } catch (e) {
        return {
          hostname: item.hostname,
        };
      }
    })
    .collect();
}
