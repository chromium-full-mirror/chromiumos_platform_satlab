import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {DutEnrollmentWizardComponent} from './dut-enrollment-wizard.component';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatRadioModule} from '@angular/material/radio';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

describe('DutEnrollmentWizardComponent', () => {
  let component: DutEnrollmentWizardComponent;
  let fixture: ComponentFixture<DutEnrollmentWizardComponent>;
  let mockRpcService: jasmine.SpyObj<SatlabRpcService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockRpcService = jasmine.createSpyObj('SatlabRpcService', [
      'getUnassignedServos',
      'listBoards',
      'listModels',
      'openCCD',
      'sendMessageToCCDSession',
      'checkDutReadiness',
      'enrollDutFromWizard',
    ]);
    mockRpcService.getUnassignedServos.and.returnValue(
      Promise.resolve([
        {serial: 'C2203190091', deviceType: 'servo', hasGscSibling: true},
      ])
    );
    mockRpcService.listBoards.and.returnValue(Promise.resolve(['brya', 'dedede']));
    mockRpcService.listModels.and.returnValue(Promise.resolve(['vell', 'redrix']));

    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'info',
      'error',
    ]);

    await TestBed.configureTestingModule({
      declarations: [DutEnrollmentWizardComponent],
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatRadioModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            hostnamePrefix: 'satlab-0wgatfqi21488022-',
            DUTs: [],
          },
        },
        {
          provide: MatDialogRef,
          useValue: {close: jasmine.createSpy('close')},
        },
        {provide: SatlabRpcService, useValue: mockRpcService},
        {provide: NotificationService, useValue: mockNotificationService},
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DutEnrollmentWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and enforce 32-char full hostname limit', () => {
    expect(component).toBeTruthy();
    // Prefix 'satlab-0wgatfqi21488022-' is 24 chars -> max suffix is 8 chars
    expect(component['maxHostnameSuffixLength']).toBe(8);

    component['hostnameInput'] = 'dut12345';
    expect(component['fullHostname'].length).toBe(32);
    expect(component['hostnameError']).toBe('');

    component['hostnameInput'] = 'dut123456';
    expect(component['fullHostname'].length).toBe(33);
    expect(component['hostnameError']).toContain('exceeds maximum of 32 characters');
  });

  it('should keep all user input when verification fails', async () => {
    component['selectedServoSerial'] = 'C2203190091';
    component['hostnameInput'] = 'dut1';
    component['assetInput'] = 'asset-123';
    component['board'] = 'brya';
    component['model'] = 'vell';

    mockRpcService.checkDutReadiness.and.returnValue(
      Promise.resolve({
        servoSerial: 'C2203190091',
        deviceType: 'servo',
        isReady: false,
        hasGscSibling: true,
        usbDevice: '',
        wpDisabled: true,
        checks: [
          {
            name: 'USB Flash Drive Detection',
            passed: false,
            details: 'USB flash drive not detected',
            hint: 'Insert a USB flash drive into the servo V4p1.',
          },
        ],
      })
    );

    await component['runReadinessChecks']();

    expect(component['verificationReady']).toBeFalse();
    expect(component['hostnameInput']).toBe('dut1');
    expect(component['assetInput']).toBe('asset-123');
    expect(component['board']).toBe('brya');
    expect(component['model']).toBe('vell');
  });

  it('should disable fields and show error when selected servo has no GSC detected, and re-enable when healthy', async () => {
    component['servos'] = [
      {serial: 'SERVO_NO_GSC', deviceType: 'servo', hasGscSibling: false},
      {serial: 'SERVO_WITH_GSC', deviceType: 'servo', hasGscSibling: true},
    ];
    component['onServoChanged']('SERVO_NO_GSC');
    expect(component['isServoMissingGsc']).toBeTrue();
    expect(component['fieldsDisabled']).toBeTrue();
    expect(component['canVerify']).toBeFalse();

    // Selecting a healthy servo re-enables fields and clears the warning
    component['onServoChanged']('SERVO_WITH_GSC');
    expect(component['isServoMissingGsc']).toBeFalse();
    expect(component['fieldsDisabled']).toBeFalse();
  });

  it('should validate new pool format (< 20 chars and only letters, digits, or "-")', () => {
    component['newPoolInput'] = 'valid-pool-123';
    expect(component['newPoolError']).toBe('');
    component['onAddNewPool']();
    expect(component['selectedPools']).toContain('valid-pool-123');
    expect(component['newPoolInput']).toBe('');

    // Invalid character (underscore)
    component['newPoolInput'] = 'invalid_pool';
    expect(component['newPoolError']).toBe(
      "Must be less than 20 characters and contain only letters, digits, or '-'"
    );
    component['onAddNewPool']();
    expect(component['selectedPools']).not.toContain('invalid_pool');

    // Too long (20 characters)
    component['newPoolInput'] = '12345678901234567890';
    expect(component['newPoolError']).toBe(
      "Must be less than 20 characters and contain only letters, digits, or '-'"
    );
    component['onAddNewPool']();
    expect(component['selectedPools']).not.toContain('12345678901234567890');
  });

  it('should sequentially prepare and enroll selected DUTs when selectedDUTs are passed', async () => {
    component['selectedDutsQueue'] = [
      {
        address: '192.168.231.101',
        name: '',
        hostname: '',
        inputHostname: 'dut-cros-1',
        board: 'brya',
        model: 'vell',
        pools: [],
        poolString: '',
        mac: '00:11:22:33:44:55',
        servoSerial: 'SERVOV4P1-S-2305152035',
        isMauiOnly: false,
        isConnected: true,
        hasAndroidDesktopImage: false,
        hasTestImage: true,
        isAccessible: true,
        status: '',
        isServoWiredCorrectly: true,
        statusHintText: '',
        ccdStatus: 'Opened',
        dimensions: {},
        hasPermission: true,
        testlabEnabled: '',
      },
      {
        address: '192.168.231.102',
        name: '',
        hostname: '',
        inputHostname: '',
        board: 'dedede',
        model: 'drawman',
        pools: [],
        poolString: '',
        mac: '00:11:22:33:44:56',
        servoSerial: 'SERVOV4P1-S-2305152036',
        isMauiOnly: false,
        isConnected: true,
        hasAndroidDesktopImage: true,
        hasTestImage: false,
        isAccessible: true,
        status: '',
        isServoWiredCorrectly: true,
        statusHintText: '',
        ccdStatus: 'Opened',
        dimensions: {},
        hasPermission: true,
        testlabEnabled: '',
      },
    ];
    component['currentDutIndex'] = 0;
    component['loadCurrentSelectedDut']();

    expect(component['isSelectedDutMode']).toBeTrue();
    expect(component['hasNextSelectedDut']).toBeTrue();
    expect(component['selectedServoSerial']).toBe('SERVOV4P1-S-2305152035');
    expect(component['hostnameInput']).toBe('dut-cros-1');
    expect(component['os']).toBe('chromeos');
    expect(component['board']).toBe('brya');
    expect(component['model']).toBe('vell');

    // Mark first DUT verified and enroll -> should advance to second DUT
    component['verificationCompleted'] = true;
    component['verificationReady'] = true;
    mockRpcService.enrollDutFromWizard.and.returnValue(
      Promise.resolve({
        hostname: 'satlab-0wgatfqi21488022-dut-cros-1',
        ipAddress: '192.168.231.101',
        deployTaskUrl: 'https://ci.chromium.org/b/1',
      })
    );

    await component['onEnrollClicked']();

    expect(component['currentDutIndex']).toBe(1);
    expect(component['hasNextSelectedDut']).toBeFalse();
    expect(component['selectedServoSerial']).toBe('SERVOV4P1-S-2305152036');
    expect(component['hostnameInput']).toBe('');
    expect(component['os']).toBe('android');
    expect(component['board']).toBe('dedede');
    expect(component['model']).toBe('drawman');
  });
});
