import {SettingsComponent} from 'app/run_suite/common/settings/settings.component';
import {IDut} from '../../../models/dut';
import {
  RunAndroidOSRequest,
  RunService,
  Suite,
  Test,
} from '../../../services/run.service';
import {
  Component,
  DestroyRef,
  EffectRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {toObservable, takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  CustomSetting,
  getDefaultCTPTimeout,
  getDefaultTrTimeout,
  getShardingGroup,
  getTestplanShardingGroup,
  InputBoxSetting,
  SingleChoiceSetting,
  ALTestingBasicFields,
  AndroidBuildBasicFields,
  GoogleDriveBasicFields,
  TestSelection,
  ALTestingOptionsSuiteTest,
  ALTestingOptionsTestplan,
  STORAGE_TESTPLAN_NAME,
} from 'app/models/run_suite_fields';
import {NotificationService} from 'app/services/notification.service';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
} from 'rxjs';
import {CommonModule} from '@angular/common';
import {LoadingComponent} from 'app/run_suite/common/loading/loading.component';
import {LoadingButtonComponent} from 'app/common/loading-button/loading-button.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {AndroidBuildPickerComponent} from '../common/android-build-picker/android-build-picker.component';
import {ProvisionFormComponent} from '../common/provision-form/provision-form.component';
import {ShowDutComponent} from 'app/run_suite/common/show-dut/show-dut.component';
import {TestOptionsCardComponent} from 'app/run_suite/common/test-options-card/test-options-card.component';
import {
  TestSourcePickerComponent,
  SourceValues,
} from '../common/test-source-picker/test-source-picker.component';
import {SuiteComponent} from '../suite/suite.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ALProvisionOptions} from 'app/models/run_suite_fields';
import {Testplan} from 'app/models/run';
import {wrapperLoading, resetSignals} from 'app/utils/operators';
import {startWithTap} from 'app/utils/rxjs_operator';
import {toIterator} from 'app/utils/iterator';

@Component({
  selector: 'app-android-build-select-form',
  templateUrl: './android-build-select-form.component.html',
  styleUrls: ['./android-build-select-form.component.scss'],
  imports: [
    CommonModule,
    LoadingButtonComponent,
    LoadingComponent,
    MatSlideToggleModule,
    ProvisionFormComponent,
    SettingsComponent,
    ShowDutComponent,
    TestOptionsCardComponent,
    TestSourcePickerComponent,
    SuiteComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class AndroidBuildSelectFormComponent implements OnDestroy {
  @ViewChild('settingsRef') settingsRef!: SettingsComponent;
  private _provisionPicker = signal<AndroidBuildPickerComponent | undefined>(
    undefined
  );
  @ViewChild('provisionPicker') set provisionPicker(
    val: AndroidBuildPickerComponent
  ) {
    this._provisionPicker.set(val);
  }
  private _testPicker = signal<AndroidBuildPickerComponent | undefined>(
    undefined
  );
  @ViewChild('testPicker') set testPicker(val: AndroidBuildPickerComponent) {
    this._testPicker.set(val);
  }

  protected duts = signal<IDut[]>([]);
  protected boardSignal = signal<string>('');
  protected modelSignal = signal<string>('');
  protected poolSignal = signal<string>('');
  protected testplanSignal = signal<string>('');
  protected provisionSignal = signal<ALProvisionOptions>({
    mode: 'DEFAULT',
    value: {
      branch: '',
      target: '',
      build: '',
    },
  });
  protected basicFieldsSignal = signal<ALTestingBasicFields>({
    mode: 'ANDROID_BUILD',
    buildValues: {
      branch: '',
      target: '',
      build: '',
    },
  });

  protected testSelectionSignal = signal<TestSelection>(null);

  protected tabSignal = signal<'suite' | 'test' | 'testplan'>('suite');
  protected isTestPlanTab = computed(() => this.tabSignal() === 'testplan');
  protected isSuiteTab = computed(() => this.tabSignal() === 'suite');
  protected isTestTab = computed(() => this.tabSignal() === 'test');
  protected sameBoardModels = computed(() => {
    const board = this.boardSignal();
    const duts = this.duts();
    return toIterator(duts)
      .filter(e => e.board === board)
      .map(e => e.model)
      .collect();
  });
  // Loading variables.
  protected isRunLoadingSignal = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected isRunLoading$ = toObservable(this.isRunLoadingSignal);
  protected isProvisionLoadingSignal = signal<boolean>(false);
  protected isTestFormLoadingSignal = computed(() => {
    return (
      this.sourcePickerLoadingSignal().show || this.suiteLoadingSignal().show
    );
  });

  protected sourcePickerLoadingSignal = signal<{
    show: boolean;
    message: string;
  }>({show: false, message: ''});
  protected suiteLoadingSignal = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  protected testOptionsLoadingSignal = computed(() => {
    if (this.sourcePickerLoadingSignal().show)
      return this.sourcePickerLoadingSignal();
    if (this.suiteLoadingSignal().show) return this.suiteLoadingSignal();
    return {show: false, message: ''};
  });

  protected testOptionsLoading$ = toObservable(this.testOptionsLoadingSignal);

  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = toObservable(this.isLoading);
  protected forceShowDutLoading = computed(() => {
    const isProvisionLoading = this.isProvisionLoadingSignal();
    const isTestFormLoading = this.isTestFormLoadingSignal();
    const isRunLoading = this.isRunLoadingSignal().show;
    return isProvisionLoading || isTestFormLoading || isRunLoading;
  });

  protected testSourceErrorMsg = signal<string>('');
  protected suiteErrorMsg = signal<string>('');
  protected combineTestOptionsError = computed(() => {
    const testSourceError = this.testSourceErrorMsg();
    const suiteErrorMsg = this.suiteErrorMsg();
    return [testSourceError, suiteErrorMsg].filter(e => !!e).join(', ');
  });

  protected onTestSourceErrorChanged(value: string) {
    this.testSourceErrorMsg.set(value);
  }

  protected onSuiteErrorsChanged(value: string) {
    this.suiteErrorMsg.set(value);
  }

  protected driveTestModuleSignal = signal<string>('');
  protected selectedDriveTestModulesSignal = signal<string[]>([]);

  protected onDriveTestModuleInputChanged(e: string) {
    this.driveTestModuleSignal.set(e);
  }

  protected onAddTestClicked() {
    const newValue = [
      ...this.selectedDriveTestModulesSignal(),
      this.driveTestModuleSignal(),
    ];
    resetSignals([this.driveTestModuleSignal]);
    this.selectedDriveTestModulesSignal.set(newValue);
    this.testSelectionSignal.update(prev => {
      return {
        ...prev,
        testModules: newValue,
      };
    });
  }

  protected onRemoveTestClicked(index: number) {
    const newValue = [...this.selectedDriveTestModulesSignal()];
    newValue.splice(index, 1);
    this.selectedDriveTestModulesSignal.set(newValue);
    this.testSelectionSignal.update(prev => {
      return {
        ...prev,
        testModules: newValue,
      };
    });
  }

  // The default settings for the run suite/test.
  protected settings = [
    getDefaultCTPTimeout(),
    getDefaultTrTimeout(),
    getShardingGroup(),
  ];
  protected testplanSettings = [
    getDefaultCTPTimeout(),
    getDefaultTrTimeout(),
    getTestplanShardingGroup(),
  ];
  protected customSettings = signal<CustomSetting[]>([...this.settings]);

  private refs: EffectRef[] = [];
  private destroyRef = inject(DestroyRef);

  protected testplan = computed(() => {
    const selection = this.testSelectionSignal();
    if (selection && 'planName' in selection) {
      return selection.planName;
    }
    return '';
  });

  protected provisionFormValid = computed(() => {
    const provision = this.provisionSignal();
    if (provision.mode === 'DEFAULT') {
      return (
        provision.value.branch !== '' &&
        provision.value.target !== '' &&
        provision.value.build !== ''
      );
    }
    return true;
  });

  protected testFormValid = computed(() => {
    const testSelectionValid = this.testSelectionValid();
    const isSelectAndroidBuild = this.selectAndroidBuild();
    const baseValid = isSelectAndroidBuild
      ? this.androidBuildValid()
      : this.googleDriveValid();
    return baseValid && testSelectionValid;
  });

  protected selectAndroidBuild = computed(() => {
    const basic = this.basicFieldsSignal();
    return basic.mode === 'ANDROID_BUILD';
  });

  protected androidBuildValid = computed(() => {
    const basic = this.basicFieldsSignal();
    if (basic.mode !== 'ANDROID_BUILD') {
      return false;
    }
    const buildValues = (basic as AndroidBuildBasicFields).buildValues;
    return (
      buildValues.branch !== '' &&
      buildValues.target !== '' &&
      buildValues.build !== ''
    );
  });

  protected googleDriveValid = computed(() => {
    const basic = this.basicFieldsSignal();
    if (basic.mode !== 'GOOGLE_DRIVE') {
      return false;
    }
    return (basic as GoogleDriveBasicFields).zipFileId !== '';
  });

  protected testSelectionValid = computed(() => {
    const selection = this.testSelectionSignal();
    if (!selection) {
      return false;
    }
    const tab = this.tabSignal();

    if (tab === 'suite') {
      const suiteTest = selection as ALTestingOptionsSuiteTest;
      return !!suiteTest.suite;
    } else if (tab === 'test') {
      const suiteTest = selection as ALTestingOptionsSuiteTest;
      return (
        !!suiteTest.suite &&
        !!suiteTest.testModules &&
        suiteTest.testModules.length > 0
      );
    }
    const testplan = selection as ALTestingOptionsTestplan;
    return !!testplan.planName;
  });

  constructor(
    private runService: RunService,
    private notification: NotificationService
  ) {
    // An observable that updates the CTP timeout and TR timeout based on the testplan.
    toObservable(this.testplan)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(testPlan => {
          if (testPlan === STORAGE_TESTPLAN_NAME) {
            return of([72, 48]);
          }
          return of([16, 16]);
        })
      )
      .subscribe(([timeout, trTimeout]) => {
        this.updateConfigs(timeout, trTimeout);
      });
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
  }

  protected onDutChanged(duts: IDut[]) {
    this.duts.set(duts);
  }

  protected onProvisionFormChanged(provisionForm: ALProvisionOptions) {
    this.provisionSignal.set(provisionForm);
    // Set the model value if users select the
    // model branch and didn't set the model value.
    for (const model of this.sameBoardModels()) {
      if (
        provisionForm.mode === 'DEFAULT' &&
        provisionForm.value.branch.includes(model)
      ) {
        this.modelSignal.set(model);
      }
    }
  }

  protected onSourceValuesChanged(source: SourceValues) {
    if (source.mode === 'ANDROID_BUILD') {
      this.basicFieldsSignal.set({
        mode: source.mode,
        buildValues: source.buildValues,
      } as ALTestingBasicFields);
    } else {
      this.basicFieldsSignal.set({
        mode: source.mode,
        zipFileId: source.zipFileId,
      } as ALTestingBasicFields);
      this.testSelectionSignal.set({
        suite: source.suite,
        testModules: this.selectedDriveTestModulesSignal(),
      });
    }
  }

  protected onSuiteValuesChanged(val: {suite: string; testModules: string[]}) {
    this.testSelectionSignal.update(prev => ({
      ...prev,
      suite: val.suite,
      testModules: val.testModules,
    }));
  }

  protected onTestplanInputChanged(planName: string) {
    this.testplanSignal.set(planName);
    this.testSelectionSignal.set({
      planName,
    });
  }

  protected onProvisionLoadingChanged(value: boolean) {
    this.isProvisionLoadingSignal.set(value);
  }

  protected onAndroidBuildPickerLoadingChanged(value: {
    show: boolean;
    message: string;
  }) {
    this.sourcePickerLoadingSignal.set(value);
  }

  protected onSuiteLoadingChanged(value: {show: boolean; message: string}) {
    this.suiteLoadingSignal.set(value);
  }

  protected onSuiteErrorChanged(value: string) {}

  protected onTabChanged(tab: 'suite' | 'test' | 'testplan') {
    const curTab = this.tabSignal();
    if (curTab === tab) return;

    // If switching to or from testplan tab, perform a full reset of test options.
    if (curTab === 'testplan' || tab === 'testplan') {
      this.testSelectionSignal.set(null);
      this.sourcePickerLoadingSignal.set({show: false, message: ''});
      this.suiteLoadingSignal.set({show: false, message: ''});
      resetSignals([
        this.testplanSignal,
        this.testSourceErrorMsg,
        this.suiteErrorMsg,
        this.selectedDriveTestModulesSignal,
      ]);
    } else {
      // Switching between suite and test: only clear the selected test modules.
      resetSignals([this.selectedDriveTestModulesSignal]);
      this.testSelectionSignal.update(prev =>
        prev ? {...prev, testModules: []} : null
      );
    }

    this.tabSignal.set(tab);
    this.customSettings.set([
      ...(tab === 'testplan' ? this.testplanSettings : this.settings),
    ]);
  }

  protected onDutRelatedValueChanged(value: {[key: string]: string}) {
    this.poolSignal.set(value['pool']);
    this.boardSignal.set(value['board']);
    this.modelSignal.set(value['model']);
  }

  protected _isRunnable = computed(() => {
    const board = this.boardSignal();
    const pool = this.poolSignal();
    const provisionFormValid = this.provisionFormValid();
    const testFormValid = this.testFormValid();
    const errrorsFromSettings = this.settingsRef?.hasErrors() || false;
    const forceShowDutLoading = this.forceShowDutLoading();
    console.log(
      'board',
      board,
      'pool',
      pool,
      'errrorsFromSettings',
      errrorsFromSettings,
      'forceShowDutLoading',
      forceShowDutLoading,
      'provisionFormValid',
      provisionFormValid,
      'testFormValid',
      testFormValid
    );
    return (
      board &&
      pool &&
      provisionFormValid &&
      !errrorsFromSettings &&
      !forceShowDutLoading &&
      provisionFormValid &&
      testFormValid
    );
  });

  protected onCustomSettingsChanged(value: CustomSetting[]) {
    this.customSettings.set([...value]);
  }

  protected onRunClicked() {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const pool = this.poolSignal();
    const tab = this.tabSignal();

    const provision = this.provisionSignal();
    const isSkipProvisioning = provision.mode === 'SKIP';

    const basic = this.basicFieldsSignal();

    const isSelectAndroidBuild = this.selectAndroidBuild();

    const androidTestValues = isSelectAndroidBuild
      ? (basic as AndroidBuildBasicFields)
      : undefined;
    const googleDriveTestValues = !isSelectAndroidBuild
      ? (basic as GoogleDriveBasicFields)
      : undefined;
    const testSelectionValues = this.testSelectionSignal();

    let testBranch = '',
      testTarget = '',
      testBuild = '',
      suite = '',
      testplan = '';
    let testModules = [];
    let tagIncludes = [],
      testIncludes = [],
      testExcludes = [];

    if (isSelectAndroidBuild) {
      testBranch = androidTestValues.buildValues.branch;
      testTarget = androidTestValues.buildValues.target;
      testBuild = androidTestValues.buildValues.build;
    } else {
      testBuild = googleDriveTestValues.zipFileId;
    }
    const s = (testSelectionValues as ALTestingOptionsSuiteTest)?.suite;
    suite = s !== '' ? `suite:${s}` : '';
    testModules =
      (testSelectionValues as ALTestingOptionsSuiteTest)?.testModules ?? [];
    testplan =
      (testSelectionValues as ALTestingOptionsTestplan)?.planName ?? '';

    if (tab === 'test') {
      testIncludes = [...testModules];
    } else {
      testExcludes = [...testModules];
    }

    const settings = this.customSettings();
    const ctpTimeout = (
      settings.find(s => s.key === 'ctpTimeout') as InputBoxSetting
    )?.state.value;
    const trTimeout = (
      settings.find(s => s.key === 'trTimeout') as InputBoxSetting
    )?.state.value;
    const shardingMode = settings.find(
      s => s.key === 'shardingMode'
    ) as SingleChoiceSetting;

    const selectedShardingOption = shardingMode.options[shardingMode.index];
    const nShards =
      selectedShardingOption.key === 'nShards'
        ? selectedShardingOption.state.value ?? undefined
        : undefined;
    const maxInShard =
      selectedShardingOption.key === 'maxInShard' ||
      selectedShardingOption.key === 'default'
        ? selectedShardingOption.state.value ?? undefined
        : undefined;
    let task: Suite | Test | Testplan;
    if (tab === 'suite' || tab === 'test') {
      task = {
        kind: 'suite',
        name: suite,
      };
      if (suite !== '') {
        tagIncludes = [...tagIncludes, suite];
      }
    } else if (tab === 'testplan') {
      task = {
        kind: 'testplan',
        name: testplan,
      };
    }

    const req: RunAndroidOSRequest = {
      os: 'android',
      board: board,
      model: model,
      pool: pool,
      skipProvisioning: isSkipProvisioning,
      target: isSkipProvisioning ? '' : provision.value.target,
      build: isSkipProvisioning ? '' : provision.value.build,
      testOptions: isSelectAndroidBuild
        ? {
            mode: 'ANDROID_BUILD',
            buildValues: {
              branch: testBranch,
              target: testTarget,
              build: testBuild,
            },
          }
        : {
            mode: 'GOOGLE_DRIVE',
            zipFileId: testBuild,
          },
      tags: {
        testNamesExclude: testExcludes,
        testNamesInclude: testIncludes,
        tagsToInclude: tagIncludes,
      },
      run: task,
      advanceSettings: {
        cft: true,
        maxInShard: maxInShard,
        ctpTimeout: ctpTimeout,
        trTimeout: trTimeout,
        nShards: nShards,
      },
    };

    wrapperLoading(
      this.runService.run(req),
      this.isLoading,
      `Running ${tab}...`
    )
      .pipe(
        startWithTap(() =>
          this.isRunLoadingSignal.set({
            show: true,
            message: `Running ${tab}...`,
          })
        ),
        finalize(() => this.isRunLoadingSignal.set({show: false, message: ''}))
      )
      .subscribe({
        next: buildLink => {
          this.notification.info(
            [
              `Triggering ${this.tabSignal()} succeed! Link:`,
              {type: 'url', url: buildLink},
            ],
            {dismiss: false}
          );
        },
        error: e => {
          this.notification.error(`Trigger job failed: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  // Updating configs if required.
  private updateConfigs(ctpTimeout: number, trTimeout: number) {
    this.customSettings.update(settings =>
      settings.map(s => {
        if (s.key === 'ctpTimeout') {
          return {...s, state: {...s.state, value: ctpTimeout}};
        } else if (s.key === 'trTimeout') {
          return {...s, state: {...s.state, value: trTimeout}};
        }
        return s;
      })
    );
  }
}
