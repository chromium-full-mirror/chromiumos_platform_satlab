import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {DutEnrollmentWizardComponent} from './dut-enrollment-wizard.component';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelect, MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatRadioModule} from '@angular/material/radio';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {By} from '@angular/platform-browser';

describe('DutEnrollmentWizardComponent', () => {
  let component: DutEnrollmentWizardComponent;
  let fixture: ComponentFixture<DutEnrollmentWizardComponent>;
  let mockRpcService: jasmine.SpyObj<SatlabRpcService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockRpcService = jasmine.createSpyObj('SatlabRpcService', [
      'getUnassignedServos',
      'listDUTs',
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
    mockRpcService.listDUTs.and.returnValue(Promise.resolve([]));
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

  it('should auto-fill OS, board, and model when selecting a servo with a connected DUT', async () => {
    component['servos'] = [
      {serial: 'SERVO_ANDROID', deviceType: 'servo', hasGscSibling: true},
      {serial: 'SERVO_UNCONNECTED', deviceType: 'servo', hasGscSibling: true},
    ];
    component['existingDuts'] = [
      {
        address: '192.168.231.105',
        name: '',
        hostname: '',
        board: 'corsola',
        model: 'steelix',
        pools: [],
        poolString: '',
        mac: 'aa:bb:cc:dd:ee:ff',
        servoSerial: 'SERVO_ANDROID',
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
    mockRpcService.listModels.and.returnValue(
      Promise.resolve(['steelix', 'rusty'])
    );

    component['onServoChanged']('SERVO_ANDROID');
    await Promise.resolve();

    expect(component['os']).toBe('android');
    expect(component['board']).toBe('corsola');
    expect(component['model']).toBe('steelix');
    expect(component['connectedDutHint']).toContain('ADB');
    expect(component['connectedDutHint']).toContain('192.168.231.105');

    // Switching to an unconnected servo clears the connected-DUT hint
    component['onServoChanged']('SERVO_UNCONNECTED');
    expect(component['connectedDutHint']).toBe('');
  });

  it('should auto-fill from background listDUTs refresh when existingDuts is initially empty', async () => {
    mockRpcService.getUnassignedServos.and.returnValue(
      Promise.resolve([
        {serial: 'SERVO_FRESH_SSH', deviceType: 'servo', hasGscSibling: true},
      ])
    );
    mockRpcService.listDUTs.and.returnValue(
      Promise.resolve([
        {
          address: '192.168.231.110',
          name: '',
          hostname: '',
          board: 'brya',
          model: 'vell',
          pools: [],
          poolString: '',
          mac: '00:11:22:33:44:99',
          servoSerial: 'SERVO_FRESH_SSH',
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
      ])
    );

    component['existingDuts'] = [];
    component['selectedServoSerial'] = '';
    component['board'] = '';
    component['model'] = '';
    component['os'] = 'android';

    await component['scanServos']();
    await Promise.resolve();

    expect(component['selectedServoSerial']).toBe('SERVO_FRESH_SSH');
    expect(component['os']).toBe('chromeos');
    expect(component['board']).toBe('brya');
    expect(component['model']).toBe('vell');
    expect(component['connectedDutHint']).toContain('SSH');
  });

  it('should mark GBB status as skipped and enable enrollment when GBB check is skipped', async () => {
    component['servos'] = [
      {serial: 'C2203190091', deviceType: 'servo', hasGscSibling: true},
    ];
    component['selectedServoSerial'] = 'C2203190091';
    component['hostnameInput'] = 'dut-skip';
    component['board'] = 'corsola';
    component['model'] = 'steelix';
    component['os'] = 'android';

    mockRpcService.checkDutReadiness.and.returnValue(
      Promise.resolve({
        servoSerial: 'C2203190091',
        deviceType: 'servo',
        isReady: true,
        hasGscSibling: true,
        usbDevice: '/dev/sda',
        wpDisabled: true,
        checks: [
          {
            name: 'GSC (Cr50/Ti50) Sibling Detection',
            passed: true,
            details: 'GSC device detected on the same USB hub',
            hint: '',
          },
          {
            name: 'GBB Flags Configuration',
            passed: true,
            details:
              'Skipped: DUT is already accessible via rooted ADB (192.168.231.105); deploy/repair will manage SW WP & GBB flags',
            hint: '',
          },
          {
            name: 'USB Flash Drive Detection',
            passed: true,
            details: 'USB flash drive detected at /dev/sda',
            hint: '',
          },
        ],
      })
    );

    await component['runReadinessChecks']();

    expect(component['gbbStatus']).toBe('skipped');
    expect(component['usbStatus']).toBe('pass');
    expect(component['verificationReady']).toBeTrue();
    expect(component['canEnroll']).toBeTrue();
    expect(component['consoleLogs']).toContain(
      '[SKIP] GBB Flags Configuration:'
    );
  });

  it('should auto-fill via MatSelect template selection and invalidate verification when inputs change', async () => {
    component['servos'] = [
      {serial: 'SERVO_CROS', deviceType: 'servo', hasGscSibling: true},
      {serial: 'SERVO_ANDROID', deviceType: 'servo', hasGscSibling: true},
    ];
    component['selectedServoSerial'] = 'SERVO_CROS';
    component['existingDuts'] = [
      {
        address: '192.168.231.105',
        name: '',
        hostname: '',
        board: 'corsola',
        model: 'steelix',
        pools: [],
        poolString: '',
        mac: 'aa:bb:cc:dd:ee:ff',
        servoSerial: 'SERVO_ANDROID',
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
    fixture.detectChanges();
    await fixture.whenStable();

    // Select SERVO_ANDROID through the actual <mat-select> option to verify
    // [ngModel] does not pre-mutate selectedServoSerial before (selectionChange).
    const servoSelect: MatSelect = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
    const secondOption = servoSelect.options.toArray()[1];
    secondOption._selectViaInteraction();
    fixture.detectChanges();
    await Promise.resolve();

    expect(component['selectedServoSerial']).toBe('SERVO_ANDROID');
    expect(component['os']).toBe('android');
    expect(component['board']).toBe('corsola');
    expect(component['model']).toBe('steelix');

    // Mark DUT prepared, then change OS -> verification must reset so GBB checks aren't bypassed
    component['hostnameInput'] = 'dut-1';
    component['verificationCompleted'] = true;
    component['verificationReady'] = true;
    component['gbbStatus'] = 'skipped';
    expect(component['canEnroll']).toBeTrue();

    component['onOSChanged']('chromeos');
    expect(component['verificationCompleted']).toBeFalse();
    expect(component['verificationReady']).toBeFalse();
    expect(component['gbbStatus']).toBe('pending');
    expect(component['canEnroll']).toBeFalse();

    // Also verify changing model, board, or servo resets verification
    component['verificationCompleted'] = true;
    component['verificationReady'] = true;
    component['onModelChanged']('rusty');
    expect(component['verificationReady']).toBeFalse();

    component['verificationCompleted'] = true;
    component['verificationReady'] = true;
    await component['onBoardChanged']('brya');
    expect(component['verificationReady']).toBeFalse();

    component['model'] = 'vell';
    component['verificationCompleted'] = true;
    component['verificationReady'] = true;
    component['onServoChanged']('SERVO_CROS');
    expect(component['verificationReady']).toBeFalse();
  });

  it('should not apply model from a different board when overwriteNonEmpty is false', () => {
    component['board'] = 'dedede';
    component['model'] = '';
    component['applyConnectedDutToForm'](
      {
        address: '192.168.231.105',
        name: '',
        hostname: '',
        board: 'corsola',
        model: 'steelix',
        pools: [],
        poolString: '',
        mac: 'aa:bb:cc:dd:ee:ff',
        servoSerial: 'C2203190091',
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
      false
    );

    expect(component['board']).toBe('dedede');
    expect(component['model']).toBe('');
  });
});
