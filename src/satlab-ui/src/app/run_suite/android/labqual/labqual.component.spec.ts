import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {IDut} from '../../../models/dut';
import {INotification} from '../../../models/notification';
import {AndroidService} from '../../../services/android.service';
import {NotificationService} from '../../../services/notification.service';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {LabqualComponent} from './labqual.component';

function makeEnrolledDut(hostname: string): IDut {
  return {
    address: '192.168.1.10',
    name: hostname,
    hostname,
    board: 'brya',
    model: 'mithrax',
    pools: [],
    poolString: '',
    mac: '00:11:22:33:44:55',
    servoSerial: 'SERVOV4P1-S-1',
    isMauiOnly: false,
    isConnected: true,
    hasTestImage: false,
    hasAndroidDesktopImage: true,
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

describe('LabqualComponent', () => {
  let component: LabqualComponent;
  let fixture: ComponentFixture<LabqualComponent>;
  let notification: NotificationService;
  let latestNotifications: INotification[];
  let mockRpcService: jasmine.SpyObj<
    Pick<SatlabRpcService, 'listEnrolledDUTs' | 'taskBuildLink'>
  >;
  let mockAndroidService: jasmine.SpyObj<
    Pick<
      AndroidService,
      'listBranches' | 'listTargets' | 'listBuilds' | 'runLabqual'
    >
  >;

  beforeEach(async () => {
    mockRpcService = jasmine.createSpyObj('SatlabRpcService', [
      'listEnrolledDUTs',
      'taskBuildLink',
    ]);
    mockRpcService.listEnrolledDUTs.and.resolveTo([]);

    mockAndroidService = jasmine.createSpyObj('AndroidService', [
      'listBranches',
      'listTargets',
      'listBuilds',
      'runLabqual',
    ]);
    mockAndroidService.listBranches.and.returnValue(of(['arsp-main']));
    mockAndroidService.listTargets.and.returnValue(
      of(['brya-trunk_staging-userdebug'])
    );
    mockAndroidService.listBuilds.and.returnValue(of(['16952429']));

    await TestBed.configureTestingModule({
      imports: [LabqualComponent, NoopAnimationsModule],
      providers: [
        {provide: SatlabRpcService, useValue: mockRpcService},
        {provide: AndroidService, useValue: mockAndroidService},
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(LabqualComponent, {
        set: {imports: [], template: ''},
      })
      .compileComponents();

    notification = TestBed.inject(NotificationService);
    latestNotifications = [];
    notification.notification$.subscribe(n => {
      latestNotifications = n;
    });

    fixture = TestBed.createComponent(LabqualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setupRunnableDut(hostname = 'satlab-0wg-dut1') {
    mockRpcService.listEnrolledDUTs.and.resolveTo([makeEnrolledDut(hostname)]);
    component.ngAfterViewInit();
    tick();
    component['onPropsChanged']('hostname', hostname);
    fixture.detectChanges();
    tick();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides Scheduke Swarming URL and polls TaskBuildLink on run', fakeAsync(() => {
    setupRunnableDut();
    const schedukeUrl =
      'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:satlab-0wg-dut1-123&st=1000';
    const expectedBuildUrl =
      'https://ci.chromium.org/p/chromeos/builders/external-4-crostest/labqual/b8664892129559008945';

    mockAndroidService.runLabqual.and.returnValue(of(schedukeUrl));
    mockRpcService.taskBuildLink.and.resolveTo({
      buildLink: expectedBuildUrl,
      isReady: true,
    });

    void component['onRunClicked']();
    tick();

    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toBe(
      'Labqual for satlab-0wg-dut1 scheduled. Waiting for LUCI build link...'
    );

    tick(2000);
    tick();

    expect(mockRpcService.taskBuildLink).toHaveBeenCalledWith(schedukeUrl);
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toEqual([
      'Triggering a Labqual succeeded! Link: ',
      {type: 'url', url: expectedBuildUrl},
    ]);
  }));

  it('shows direct Buildbucket URL immediately without polling', fakeAsync(() => {
    setupRunnableDut();
    const directUrl =
      'https://ci.chromium.org/p/chromeos/builders/labpack_runner/labqual/b12345';
    mockAndroidService.runLabqual.and.returnValue(of(directUrl));

    void component['onRunClicked']();
    tick();

    expect(mockRpcService.taskBuildLink).not.toHaveBeenCalled();
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toEqual([
      'Triggering a Labqual succeeded! Link: ',
      {type: 'url', url: directUrl},
    ]);
  }));
});
