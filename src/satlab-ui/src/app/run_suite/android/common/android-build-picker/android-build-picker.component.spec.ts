import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {IDut} from '../../../../models/dut';
import {AndroidService} from '../../../../services/android.service';
import {NotificationService} from '../../../../services/notification.service';
import {AutocompleteComponent} from '../../../common/autocomplete/autocomplete.component';

import {AndroidBuildPickerComponent} from './android-build-picker.component';

describe('AndroidBuildPickerComponent', () => {
  let component: AndroidBuildPickerComponent;
  let fixture: ComponentFixture<AndroidBuildPickerComponent>;
  let androidServiceSpy: jasmine.SpyObj<AndroidService>;

  beforeEach(() => {
    androidServiceSpy = jasmine.createSpyObj('AndroidService', [
      'listBranches',
      'listTargets',
      'listBuilds',
      'validateBuild',
    ]);
    androidServiceSpy.listBranches.and.returnValue(of([]));
    androidServiceSpy.listTargets.and.returnValue(of([]));
    androidServiceSpy.listBuilds.and.returnValue(of([]));
    androidServiceSpy.validateBuild.and.returnValue(of(true));

    const notificationSpy = jasmine.createSpyObj('NotificationService', [
      'info',
      'error',
    ]);

    TestBed.configureTestingModule({
      imports: [AndroidBuildPickerComponent, NoopAnimationsModule],
      providers: [
        {provide: AndroidService, useValue: androidServiceSpy},
        {provide: NotificationService, useValue: notificationSpy},
      ],
    });
    fixture = TestBed.createComponent(AndroidBuildPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should preserve test branch options across board changes and ignore OS model filtering', () => {
    androidServiceSpy.listBranches.and.returnValue(
      of([
        'git_main',
        'partner-android17-tests-dev',
        'arsp-emerald-tests-release',
      ])
    );
    androidServiceSpy.listTargets.and.returnValue(
      of(['test_suites_x86_64', 'ruby-userdebug'])
    );

    component.duts = [
      {board: 'fatcat', model: 'ruby'} as IDut,
      {board: 'fatcat', model: 'emerald'} as IDut,
    ];
    component.type = 'test';
    component.board = 'fatcat';
    fixture.detectChanges();

    expect(androidServiceSpy.listBranches).toHaveBeenCalledTimes(1);
    expect(androidServiceSpy.listBranches).toHaveBeenCalledWith([
      'aosp_x86_64',
      'aosp_arm64_plus_armv7',
      'aosp_arm64_desktop',
      'aosp_x86_64_desktop',
    ]);

    const autocompletes = fixture.debugElement.queryAll(
      By.directive(AutocompleteComponent)
    );
    const branchAutocomplete = autocompletes[0]
      .componentInstance as AutocompleteComponent;
    const branchInput = autocompletes[0].nativeElement.querySelector(
      'input'
    ) as HTMLInputElement;
    const targetInput = autocompletes[1].nativeElement.querySelector(
      'input'
    ) as HTMLInputElement;

    branchAutocomplete.selectChanged.emit('partner-android17-tests-dev');
    fixture.detectChanges();
    expect(androidServiceSpy.listTargets).toHaveBeenCalledWith(
      'partner-android17-tests-dev'
    );

    // Selecting or auto-detecting a DUT model should not reset the selected test branch
    // or hide test branches containing another model's substring.
    component.model = 'ruby';
    fixture.detectChanges();

    expect(branchInput.value).toBe('partner-android17-tests-dev');
    expect(targetInput.disabled).toBeFalse();

    // Switching boards should preserve the already-loaded test branch list without re-fetching,
    // including branches whose names contain other DUT model substrings.
    component.board = 'brya';
    fixture.detectChanges();

    expect(androidServiceSpy.listBranches).toHaveBeenCalledTimes(1);
    expect(branchInput.disabled).toBeFalse();
    branchInput.click();
    fixture.detectChanges();
    expect(
      autocompletes[0].nativeElement.querySelectorAll('mat-list-item').length
    ).toBe(3);
  });

  it('should filter by model and re-fetch OS branches on board change when type is provision', () => {
    androidServiceSpy.listBranches.and.returnValues(
      of(['arsp-fatcat-ruby-release', 'arsp-fatcat-emerald-release']),
      of(['arsp-brya-vell-release'])
    );

    component.duts = [
      {board: 'fatcat', model: 'ruby'} as IDut,
      {board: 'fatcat', model: 'emerald'} as IDut,
    ];
    component.type = 'provision';
    component.board = 'fatcat';
    fixture.detectChanges();

    expect(androidServiceSpy.listBranches).toHaveBeenCalledTimes(1);

    component.model = 'ruby';
    fixture.detectChanges();

    const branchDebugEl = fixture.debugElement.queryAll(
      By.directive(AutocompleteComponent)
    )[0];
    branchDebugEl.nativeElement.querySelector('input').click();
    fixture.detectChanges();
    const items = branchDebugEl.nativeElement.querySelectorAll('mat-list-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent.trim()).toBe('arsp-fatcat-ruby-release');

    component.board = 'brya';
    fixture.detectChanges();

    expect(androidServiceSpy.listBranches).toHaveBeenCalledTimes(2);
  });
});
