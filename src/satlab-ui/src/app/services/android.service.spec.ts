import {AndroidService} from './android.service';
import {CreateTestEffortRequest, CreateTestEffortResponse, TestEffort} from './satlabrpc_pb';
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
      (service as unknown as {client: {createTestEffort: jasmine.Spy}}).client,
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

    expect(fwConfigs[0].getFirmwareTarget()?.getAp()?.getMajorVersion()).toBe(16759);
    expect(fwConfigs[0].getFirmwareTarget()?.getAp()?.getMinorVersion()).toBe(22);
    expect(fwConfigs[0].getFirmwareTarget()?.getAp()?.getPatchNumber()).toBe(0);
    expect(fwConfigs[0].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_ONLY,
    ]);

    expect(fwConfigs[1].getFirmwareTarget()?.getEc()?.getMajorVersion()).toBe(16765);
    expect(fwConfigs[1].getFirmwareTarget()?.getEc()?.getMinorVersion()).toBe(2);
    expect(fwConfigs[1].getFirmwareTarget()?.getEc()?.getPatchNumber()).toBe(21);
    expect(fwConfigs[1].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_WRITE,
    ]);

    expect(fwConfigs[2].getFirmwareTarget()?.getGsc()?.getMajorVersion()).toBe(1);
    expect(fwConfigs[2].getFirmwareTarget()?.getGsc()?.getMinorVersion()).toBe(2);
    expect(fwConfigs[2].getFirmwareTarget()?.getGsc()?.getGeneration()).toBe(3);
    expect(fwConfigs[2].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_ONLY,
    ]);

    expect(fwConfigs[3].getFirmwareTarget()?.getFpmcu()?.getMajorVersion()).toBe(4);
    expect(fwConfigs[3].getFirmwareTarget()?.getFpmcu()?.getMinorVersion()).toBe(5);
    expect(fwConfigs[3].getFirmwareTarget()?.getFpmcu()?.getPatchNumber()).toBe(6);
    expect(fwConfigs[3].getFirmwareTypesList()).toEqual([
      TestEffort.FirmwareType.FIRMWARE_TYPE_READ_WRITE,
    ]);
  });
});
