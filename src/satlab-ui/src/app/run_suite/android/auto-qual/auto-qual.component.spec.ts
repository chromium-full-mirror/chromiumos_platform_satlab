import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {AndroidService} from 'app/services/android.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {
  CreateTestEffortResponse,
  ListTestEffortsResponse,
} from 'app/services/satlabrpc_pb';

import {AutoQualComponent} from './auto-qual.component';

describe('AutoQualComponent', () => {
  let component: AutoQualComponent;
  let fixture: ComponentFixture<AutoQualComponent>;
  let androidServiceSpy: jasmine.SpyObj<AndroidService>;

  beforeEach(() => {
    androidServiceSpy = jasmine.createSpyObj('AndroidService', [
      'listTestEfforts',
      'createTestEffort',
      'cancelTestEffort',
      'validateBuild',
      'listBranches',
      'listTargets',
      'listBuilds',
    ]);
    androidServiceSpy.listTestEfforts.and.returnValue(
      of(new ListTestEffortsResponse())
    );
    androidServiceSpy.createTestEffort.and.returnValue(
      of(new CreateTestEffortResponse().setId('effort-1'))
    );

    const rpcServiceSpy = jasmine.createSpyObj('SatlabRpcService', [
      'listEnrolledDUTs',
    ]);
    rpcServiceSpy.listEnrolledDUTs.and.returnValue(Promise.resolve([]));

    const notificationSpy = jasmine.createSpyObj('NotificationService', [
      'info',
      'error',
    ]);

    TestBed.configureTestingModule({
      imports: [AutoQualComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        {provide: AndroidService, useValue: androidServiceSpy},
        {provide: SatlabRpcService, useValue: rpcServiceSpy},
        {provide: NotificationService, useValue: notificationSpy},
      ],
    });
    fixture = TestBed.createComponent(AutoQualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enforce min 1 and max 8 firmware rows', () => {
    const comp = component as unknown as {
      firmwareRowsSignal: () => {target: string; type: string; version: string}[];
      onAddFirmwareRowClicked: () => void;
      onRemoveFirmwareRowClicked: (index: number) => void;
    };

    expect(comp.firmwareRowsSignal().length).toBe(1);

    // Cannot delete the last remaining row
    comp.onRemoveFirmwareRowClicked(0);
    expect(comp.firmwareRowsSignal().length).toBe(1);

    // Add rows up to the max of 8
    for (let i = 0; i < 10; i++) {
      comp.onAddFirmwareRowClicked();
    }
    expect(comp.firmwareRowsSignal().length).toBe(8);

    // Can delete when > 1 row
    comp.onRemoveFirmwareRowClicked(7);
    expect(comp.firmwareRowsSignal().length).toBe(7);
  });

  it('should validate firmware version format and duplicate target/type pairs', () => {
    const comp = component as unknown as {
      isFirmwareVersionEnabledSignal: {set: (v: boolean) => void};
      firmwareRowsSignal: {
        set: (v: {target: string; type: string; version: string}[]) => void;
      };
      firmwareRowErrors: () => string[];
      isFirmwareValid: () => boolean;
    };

    comp.isFirmwareVersionEnabledSignal.set(true);

    // Blank version is valid
    comp.firmwareRowsSignal.set([{target: 'ap', type: 'ro', version: ''}]);
    expect(comp.isFirmwareValid()).toBeTrue();

    // Invalid version format
    comp.firmwareRowsSignal.set([{target: 'ap', type: 'ro', version: '1.2'}]);
    expect(comp.isFirmwareValid()).toBeFalse();
    expect(comp.firmwareRowErrors()[0]).toContain('major.minor.patch');

    // Valid version format
    comp.firmwareRowsSignal.set([
      {target: 'ap', type: 'ro', version: '16759.22.0'},
    ]);
    expect(comp.isFirmwareValid()).toBeTrue();

    // Duplicate (target, type) combination
    comp.firmwareRowsSignal.set([
      {target: 'ap', type: 'ro', version: '16759.22.0'},
      {target: 'ap', type: 'ro', version: '16759.23.0'},
    ]);
    expect(comp.isFirmwareValid()).toBeFalse();
    expect(comp.firmwareRowErrors()[0]).toContain('Duplicate');
  });

  it('should forward non-empty firmware rows to createTestEffort', () => {
    const comp = component as unknown as {
      boardSignal: {set: (v: string) => void};
      modelSignal: {set: (v: string) => void};
      branchSignal: {set: (v: string) => void};
      boardTargetSignal: {set: (v: string) => void};
      testTargetSignal: {set: (v: string) => void};
      poolSignal: {set: (v: string) => void};
      buildSignal: {set: (v: string) => void};
      validBuildSignal: {set: (v: string) => void};
      testplanSignal: {set: (v: string) => void};
      isFirmwareVersionEnabledSignal: {set: (v: boolean) => void};
      firmwareRowsSignal: {
        set: (v: {target: string; type: string; version: string}[]) => void;
      };
      onScheduleClicked: () => void;
    };

    comp.boardSignal.set('tanjiro');
    comp.modelSignal.set('sapphire');
    comp.branchSignal.set('arsp-26Q3-desktop-release');
    comp.boardTargetSignal.set('sapphire-userdebug');
    comp.testTargetSignal.set('test_suites_x86_64');
    comp.poolSignal.set('satlab-pool');
    comp.buildSignal.set('12345');
    comp.validBuildSignal.set('12345');
    comp.testplanSignal.set('dts/avs/firmware');
    comp.isFirmwareVersionEnabledSignal.set(true);
    comp.firmwareRowsSignal.set([
      {target: 'ap', type: 'ro', version: '16759.22.0'},
      {target: 'ap', type: 'rw', version: '16759.22.0'},
      {target: 'ec', type: 'ro', version: ''},
    ]);

    comp.onScheduleClicked();

    expect(androidServiceSpy.createTestEffort).toHaveBeenCalledWith(
      jasmine.objectContaining({
        firmwareConfigs: [
          {target: 'ap', type: 'ro', major: 16759, minor: 22, patch: 0},
          {target: 'ap', type: 'rw', major: 16759, minor: 22, patch: 0},
        ],
      })
    );
  });
});
