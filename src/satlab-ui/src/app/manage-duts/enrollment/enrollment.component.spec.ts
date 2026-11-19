import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';

import {IDut} from '../../models/dut';
import {INotification} from '../../models/notification';
import {AndroidService} from '../../services/android.service';
import {DevicesService} from '../../services/devices.service';
import {NotificationService} from '../../services/notification.service';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {EnrollmentComponent} from './enrollment.component';

function makeEnrolledDut(hostname: string): IDut {
  return {
    address: '192.168.1.10',
    name: hostname,
    hostname,
    board: 'brya',
    model: 'vell',
    pools: [],
    poolString: '',
    mac: '00:11:22:33:44:55',
    servoSerial: 'SERVOV4P1-S-1',
    isMauiOnly: false,
    isConnected: true,
    hasTestImage: true,
    hasAndroidDesktopImage: false,
    status: '',
    isAccessible: true,
    isServoWiredCorrectly: true,
    statusHintText: '',
    ccdStatus: 'Opened',
    testlabEnabled: '',
    dimensions: {},
    hasPermission: true,
  };
}

describe('EnrollmentComponent', () => {
  let component: EnrollmentComponent;
  let fixture: ComponentFixture<EnrollmentComponent>;
  let notification: NotificationService;
  let latestNotifications: INotification[];
  let mockRpcService: jasmine.SpyObj<
    Pick<SatlabRpcService, 'repairDuts' | 'taskBuildLink'>
  >;

  beforeEach(async () => {
    mockRpcService = jasmine.createSpyObj('SatlabRpcService', [
      'repairDuts',
      'taskBuildLink',
    ]);

    await TestBed.configureTestingModule({
      declarations: [EnrollmentComponent],
      providers: [
        {provide: SatlabRpcService, useValue: mockRpcService},
        {
          provide: DevicesService,
          useValue: jasmine.createSpyObj('DevicesService', ['updateDevices']),
        },
        {
          provide: AndroidService,
          useValue: jasmine.createSpyObj('AndroidService', ['runLabqual']),
        },
        {
          provide: MatDialog,
          useValue: jasmine.createSpyObj('MatDialog', ['open']),
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideTemplate(EnrollmentComponent, '')
      .compileComponents();

    notification = TestBed.inject(NotificationService);
    latestNotifications = [];
    notification.notification$.subscribe(n => {
      latestNotifications = n;
    });

    fixture = TestBed.createComponent(EnrollmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides Scheduke Swarming URL and polls TaskBuildLink on repair', fakeAsync(() => {
    const hostname = 'satlab-0wg-dut1';
    const schedukeUrl =
      'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:satlab-0wg-dut1-123&st=1000';
    const expectedBuildUrl =
      'https://ci.chromium.org/p/chromeos/builders/external-4-crostest/repair/b8664892129559008945';

    component['selectedDUTs'].set([makeEnrolledDut(hostname)]);
    mockRpcService.repairDuts.and.resolveTo([
      {
        hostname,
        buildLink: schedukeUrl,
        taskLink: '',
        isSuccess: true,
      },
    ]);
    mockRpcService.taskBuildLink.and.resolveTo({
      buildLink: expectedBuildUrl,
      isReady: true,
    });

    component['onRepairClicked']();
    tick();

    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toBe(
      `Repair ${hostname} scheduled. Waiting for LUCI build link...`
    );

    tick(2000);
    tick();

    expect(mockRpcService.taskBuildLink).toHaveBeenCalledWith(schedukeUrl);
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toEqual([
      `Repair ${hostname} succeeded: `,
      {type: 'url', url: expectedBuildUrl},
    ]);
  }));

  it('shows direct Buildbucket URL immediately without polling on repair', fakeAsync(() => {
    const hostname = 'satlab-0wg-dut1';
    const directUrl =
      'https://ci.chromium.org/p/chromeos/builders/labpack_runner/repair/b12345';

    component['selectedDUTs'].set([makeEnrolledDut(hostname)]);
    mockRpcService.repairDuts.and.resolveTo([
      {
        hostname,
        buildLink: directUrl,
        taskLink: '',
        isSuccess: true,
      },
    ]);

    component['onRepairClicked']();
    tick();

    expect(mockRpcService.taskBuildLink).not.toHaveBeenCalled();
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toEqual([
      `Repair ${hostname} succeeded: `,
      {type: 'url', url: directUrl},
    ]);
  }));
});
