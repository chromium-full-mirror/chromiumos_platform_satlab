import {AndroidService} from './android.service';
import {
  CreateTestEffortRequest,
  CreateTestEffortResponse,
  ListAndroidBranchesRequest,
  ListAndroidBranchesResponse,
  ListAndroidTargetsRequest,
  ListAndroidTargetsResponse,
  TestEffort,
} from './satlabrpc_pb';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';

describe('AndroidService', () => {
  let service: AndroidService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AndroidService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should populate firmwareConfigs in CreateTestEffortRequest', async () => {
    let capturedRequest: CreateTestEffortRequest | undefined;
    spyOn(
      (
        service as unknown as {
          client: {
            createTestEffort: (
              req: CreateTestEffortRequest
            ) => Promise<CreateTestEffortResponse>;
          };
        }
      ).client,
      'createTestEffort'
    ).and.callFake((req: CreateTestEffortRequest) => {
      capturedRequest = req;
      return Promise.resolve(new CreateTestEffortResponse().setId('effort-1'));
    });

    await firstValueFrom(
      service.createTestEffort({
        board: 'fatcat',
        model: 'ruby',
        branch: 'arsp-main',
        target: 'ruby-userdebug',
        build: '123456',
        testplan: 'dts/avs/firmware',
        pools: [{label: 'pool-1', type: 1}],
        firmwareConfigs: [
          {target: 'ap', type: 'ro', major: 16759, minor: 22, patch: 0},
          {target: 'ec', type: 'rw', major: 16765, minor: 2, patch: 21},
          {target: 'gsc', type: 'ro', major: 1, minor: 2, patch: 3},
          {target: 'fpmcu', type: 'rw', major: 4, minor: 5, patch: 6},
        ],
      })
    );

    expect(capturedRequest).toBeDefined();
    const effort = capturedRequest!.getEffort()!;
    const fwConfigs = effort.getFirmwareConfigsList();
    expect(fwConfigs.length).toBe(4);

    expect(fwConfigs[0].getFirmwareTarget()?.getAp()?.getMajorVersion()).toBe(
      16759
    );
    expect(fwConfigs[0].getFirmwareTarget()?.getAp()?.getMinorVersion()).toBe(
      22
    );
    expect(fwConfigs[0].getFirmwareTarget()?.getAp()?.getPatchNumber()).toBe(0);
    expect(fwConfigs[0].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_ONLY,
    ]);

    expect(fwConfigs[1].getFirmwareTarget()?.getEc()?.getMajorVersion()).toBe(
      16765
    );
    expect(fwConfigs[1].getFirmwareTarget()?.getEc()?.getMinorVersion()).toBe(
      2
    );
    expect(fwConfigs[1].getFirmwareTarget()?.getEc()?.getPatchNumber()).toBe(
      21
    );
    expect(fwConfigs[1].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_WRITE,
    ]);

    expect(fwConfigs[2].getFirmwareTarget()?.getGsc()?.getMajorVersion()).toBe(
      1
    );
    expect(fwConfigs[2].getFirmwareTarget()?.getGsc()?.getMinorVersion()).toBe(
      2
    );
    expect(fwConfigs[2].getFirmwareTarget()?.getGsc()?.getGeneration()).toBe(3);
    expect(fwConfigs[2].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_ONLY,
    ]);

    expect(
      fwConfigs[3].getFirmwareTarget()?.getFpmcu()?.getMajorVersion()
    ).toBe(4);
    expect(
      fwConfigs[3].getFirmwareTarget()?.getFpmcu()?.getMinorVersion()
    ).toBe(5);
    expect(fwConfigs[3].getFirmwareTarget()?.getFpmcu()?.getPatchNumber()).toBe(
      6
    );
    expect(fwConfigs[3].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_WRITE,
    ]);
  });

  it('should cache listBranches across target-order variations, deduplicate, and clone results', async () => {
    const spy = spyOn(
      (
        service as unknown as {
          client: {
            listAndroidBranches: (
              req: ListAndroidBranchesRequest
            ) => Promise<ListAndroidBranchesResponse>;
          };
        }
      ).client,
      'listAndroidBranches'
    ).and.callFake((req: ListAndroidBranchesRequest) => {
      expect(req.getTargetsList()).toEqual([
        'aosp_arm64_desktop',
        'aosp_x86_64',
      ]);
      return Promise.resolve(
        new ListAndroidBranchesResponse().setBranchesList([
          'git_main',
          'arsp-main',
          'git_main',
        ])
      );
    });

    const [first, second] = await Promise.all([
      firstValueFrom(
        service.listBranches(['aosp_x86_64', 'aosp_arm64_desktop'])
      ),
      firstValueFrom(
        service.listBranches([
          'aosp_arm64_desktop',
          'aosp_x86_64',
          'aosp_x86_64',
        ])
      ),
    ]);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(first).toEqual(['git_main', 'arsp-main']);
    expect(second).toEqual(['git_main', 'arsp-main']);

    first.push('mutated');
    const third = await firstValueFrom(
      service.listBranches(['aosp_x86_64', 'aosp_arm64_desktop'])
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(third).toEqual(['git_main', 'arsp-main']);
  });

  it('should evict listBranches cache entry on error so retries succeed', async () => {
    let attempts = 0;
    const spy = spyOn(
      (
        service as unknown as {
          client: {
            listAndroidBranches: (
              req: ListAndroidBranchesRequest
            ) => Promise<ListAndroidBranchesResponse>;
          };
        }
      ).client,
      'listAndroidBranches'
    ).and.callFake(() => {
      attempts += 1;
      if (attempts === 1) {
        return Promise.reject(new Error('transient RPC failure'));
      }
      return Promise.resolve(
        new ListAndroidBranchesResponse().setBranchesList(['arsp-main'])
      );
    });

    await expectAsync(
      firstValueFrom(service.listBranches(['aosp_x86_64']))
    ).toBeRejectedWithError('transient RPC failure');

    const recovered = await firstValueFrom(
      service.listBranches(['aosp_x86_64'])
    );
    expect(spy).toHaveBeenCalledTimes(2);
    expect(recovered).toEqual(['arsp-main']);
  });

  it('should cache listTargets, short-circuit blank branch, and clear via clearCache()', async () => {
    const spy = spyOn(
      (
        service as unknown as {
          client: {
            listAndroidTargets: (
              req: ListAndroidTargetsRequest
            ) => Promise<ListAndroidTargetsResponse>;
          };
        }
      ).client,
      'listAndroidTargets'
    ).and.callFake((req: ListAndroidTargetsRequest) => {
      expect(req.getBranch()).toBe('arsp-main');
      return Promise.resolve(
        new ListAndroidTargetsResponse().setTargetsList([
          'test_suites_x86_64',
          'test_suites_x86_64',
        ])
      );
    });

    const empty = await firstValueFrom(service.listTargets('   '));
    expect(empty).toEqual([]);
    expect(spy).not.toHaveBeenCalled();

    const first = await firstValueFrom(service.listTargets(' arsp-main '));
    const second = await firstValueFrom(service.listTargets('arsp-main'));
    expect(first).toEqual(['test_suites_x86_64']);
    expect(second).toEqual(['test_suites_x86_64']);
    expect(spy).toHaveBeenCalledTimes(1);

    service.clearCache();
    await firstValueFrom(service.listTargets('arsp-main'));
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
