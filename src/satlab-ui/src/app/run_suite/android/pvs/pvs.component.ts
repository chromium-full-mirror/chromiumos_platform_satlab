import {LoadingButtonComponent} from '../../../common/loading-button/loading-button.component';
import {LoadingComponent} from '../../common/loading/loading.component';
import {
  Component,
  EffectRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {IDut} from 'app/models/dut';
import {NotificationService} from 'app/services/notification.service';
import {RunAndroidOSRequest, RunService} from 'app/services/run.service';
import {toIterator} from 'app/utils/iterator';
import {wrapperLoading, resetSignals} from 'app/utils/operators';
import {SettingsComponent} from 'app/run_suite/common/settings/settings.component';
import {
  CustomSetting,
  getDefaultCTPTimeout,
  getDefaultTrTimeout,
  getTestplanShardingGroup,
  ALProvisionOptions,
  ALTestingBasicFields,
  AndroidBuildBasicFields,
  GoogleDriveBasicFields,
  MEMORY_TESTPLAN_NAME,
  STORAGE_TESTPLAN_NAME,
  InputBoxSetting,
  SingleChoiceSetting,
} from 'app/models/run_suite_fields';
import {ProvisionFormComponent} from '../common/provision-form/provision-form.component';
import {TestOptionsCardComponent} from 'app/run_suite/common/test-options-card/test-options-card.component';
import {
  TestSourcePickerComponent,
  SourceValues,
} from '../common/test-source-picker/test-source-picker.component';
import {NgIf} from '@angular/common';
import {finalize} from 'rxjs';
import {Test, Testplan} from 'app/models/run';
import {startWithTap} from 'app/utils/rxjs_operator';
import {ShowDutComponent} from 'app/run_suite/common/show-dut/show-dut.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
    selector: 'app-pvs',
    templateUrl: './pvs.component.html',
    styleUrls: ['./pvs.component.scss'],
    imports: [
        LoadingComponent,
        LoadingButtonComponent,
        NgIf,
        ProvisionFormComponent,
        SettingsComponent,
        TestOptionsCardComponent,
        TestSourcePickerComponent,
        ShowDutComponent,
        MatFormFieldModule,
        MatInputModule,
    ]
})
export class PvsComponent implements OnInit, OnDestroy {
  @ViewChild('settingsRef') settingsRef!: SettingsComponent;
  protected boardSignal = signal<string>('');
  protected modelSignal = signal<string>('');
  protected hostnameSignal = signal<string>('');
  protected poolSignal = signal<string>('');
  protected duts = signal<IDut[]>([]);
  protected tabSignal = signal<'storage' | 'memory'>('storage');
  protected defaultSettings = [
    getDefaultCTPTimeout(),
    getDefaultTrTimeout(),
    getTestplanShardingGroup(),
  ];
  protected settings = signal<CustomSetting[]>([...this.defaultSettings]);

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

  // Loading variables.
  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = toObservable(this.isLoading);
  protected isProvisionLoadingSignal = signal<boolean>(false);
  protected isTestFormLoadingSignal = computed(
    () => this.testOptionsLoadingSignal().show
  );
  protected testOptionsLoadingSignal = signal<{show: boolean; message: string}>(
    {show: false, message: ''}
  );
  protected testOptionsLoading$ = toObservable(this.testOptionsLoadingSignal);
  protected isRunLoadingSignal = signal<boolean>(false);
  protected forceShowDutLoading = computed(() => {
    const isProvisionLoading = this.isProvisionLoadingSignal();
    const isTestFormLoading = this.isTestFormLoadingSignal();
    const isLoading = this.isLoading().show;
    const isRunLoading = this.isRunLoadingSignal();

    return isProvisionLoading || isTestFormLoading || isLoading || isRunLoading;
  });

  // Get all models for the same board.
  protected sameBoardModels = computed(() => {
    const board = this.boardSignal();
    const duts = this.duts();
    return toIterator(duts)
      .filter(e => e.board === board)
      .map(e => e.model)
      .collect();
  });

  protected testplanValue = computed(() => {
    const tab = this.tabSignal();
    if (tab === 'storage') {
      return STORAGE_TESTPLAN_NAME;
    }
    return MEMORY_TESTPLAN_NAME;
  });

  protected testOptionsErrorMsg = signal<string>('');
  protected onTestOptionsErrorsChanged(value: string) {
    this.testOptionsErrorMsg.set(value);
  }
  protected storageAVLTestType = signal<'runTestplan' | 'runSingleTest'>(
    'runTestplan'
  );
  protected storageTestNameSignal = signal<string>('');

  protected onStorageAVLTestTypeChanged(
    storageAVLTestType: 'runTestplan' | 'runSingleTest'
  ) {
    this.storageAVLTestType.set(storageAVLTestType);
    resetSignals([this.storageTestNameSignal]);
  }

  protected onStorageAVLTestInputValueChanged(event: Event) {
    const testName = (event.target as HTMLInputElement).value;
    this.storageTestNameSignal.set(testName);
  }

  protected onSourceValuesChanged(source: SourceValues) {
    if (source.mode === 'ANDROID_BUILD') {
      this.basicFieldsSignal.set({
        mode: source.mode,
        buildValues: source.buildValues,
      });
    } else {
      this.basicFieldsSignal.set({
        mode: source.mode,
        zipFileId: source.zipFileId,
      });
    }
  }

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
    const basic = this.basicFieldsSignal();
    const tab = this.tabSignal();

    let isBasicValid = true;
    if (basic.mode === 'ANDROID_BUILD') {
      isBasicValid = this.androidBuildBasicValid();
    } else if (basic.mode === 'GOOGLE_DRIVE') {
      isBasicValid = this.googleDriveBasicValid();
    }

    if (tab === 'storage') {
      return isBasicValid && this.isAVLTaskValid();
    }

    return isBasicValid;
  });

  protected androidBuildBasicValid = computed(() => {
    const basic = this.basicFieldsSignal() as AndroidBuildBasicFields;
    if (basic.mode !== 'ANDROID_BUILD') {
      return false;
    }
    const buildValues = basic.buildValues;
    const basicBuildValid =
      buildValues.branch !== '' &&
      buildValues.target !== '' &&
      buildValues.build !== '';
    return basicBuildValid;
  });

  protected isAVLTaskValid = computed(() => {
    const tab = this.tabSignal();
    const testplanName = this.testplanValue();
    const storageAVLTestType = this.storageAVLTestType();
    if (tab === 'memory') {
      return testplanName === MEMORY_TESTPLAN_NAME;
    } else {
      if (storageAVLTestType === 'runTestplan') {
        return testplanName === STORAGE_TESTPLAN_NAME;
      } else {
        return this.storageTestNameSignal() !== '';
      }
    }
  });

  protected googleDriveBasicValid = computed(() => {
    const basic = this.basicFieldsSignal();
    if (basic.mode !== 'GOOGLE_DRIVE') {
      return false;
    }
    const basicValid = (basic as GoogleDriveBasicFields).zipFileId !== '';
    return basicValid;
  });

  private refs: EffectRef[] = [];

  constructor(
    private notification: NotificationService,
    private runService: RunService
  ) {}

  ngOnInit() {
    this.updateConfigs(72, 48);
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
  }

  protected onDutChanged(duts: IDut[]) {
    this.duts.set(duts);
  }

  protected onDutRelatedValueChanged(value: {
    board: string;
    model: string;
    pool: string;
    hostname?: string;
  }) {
    this.hostnameSignal.set(value.hostname || '');
    this.boardSignal.set(value.board);
    this.modelSignal.set(value.model);
    this.poolSignal.set(value.pool);
  }

  protected onPropsChanged(
    key: string,
    value: string | string[] | ALProvisionOptions | ALTestingBasicFields
  ) {
    switch (key) {
      case 'tab':
        resetSignals([this.storageTestNameSignal]);
        this.tabSignal.set(value as 'storage' | 'memory');
        break;
      case 'hostname':
        const hostname = (value as string).trim();
        const dut = toIterator(this.duts()).first_where(
          e => e.hostname === hostname
        );
        this.hostnameSignal.set(hostname);
        this.boardSignal.set(dut.board);
        this.modelSignal.set(dut.model);
        break;
      case 'provisionForm':
        const provisionForm = value as ALProvisionOptions;
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
        break;
    }
  }

  protected onProvisionLoadingChanged(value: boolean) {
    this.isProvisionLoadingSignal.set(value);
  }

  protected onTestFormLoadingChanged(value: {show: boolean; message: string}) {
    this.testOptionsLoadingSignal.set(value);
  }

  protected onCustomSettingsChanged(value: CustomSetting[]) {
    this.settings.set([...value]);
  }

  protected isRunnable = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const hostname = this.hostnameSignal();
    const provisionFormValid = this.provisionFormValid();
    const testFormValid = this.testFormValid();
    const errorsFromSettings = this.settingsRef?.hasErrors() || false;
    const forceShowDutLoading = this.forceShowDutLoading();
    console.log(
      'board: ',
      board,
      'model: ',
      model,
      'hostname: ',
      hostname,
      'provisionFormValid: ',
      provisionFormValid,
      'testFormValid: ',
      testFormValid,
      'errrorsFromSettings: ',
      errorsFromSettings,
      'loading: ',
      !forceShowDutLoading
    );
    return (
      board !== '' &&
      model !== '' &&
      hostname !== '' &&
      provisionFormValid &&
      testFormValid &&
      !errorsFromSettings &&
      !forceShowDutLoading
    );
  });

  private updateConfigs(ctpTimeout: number, trTimeout: number) {
    this.settings.update(settings =>
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

  onRunClicked() {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const hostname = this.hostnameSignal();
    const pool = this.poolSignal();
    const testplan = this.testplanValue();
    const avlDomain = this.tabSignal();
    const isRunTestplan = this.storageAVLTestType() === 'runTestplan';

    const task: Testplan | Test =
      avlDomain === 'memory'
        ? {
            kind: 'testplan',
            name: testplan,
          }
        : isRunTestplan
          ? {
              kind: 'testplan',
              name: testplan,
            }
          : {
              kind: 'test',
              name: this.storageTestNameSignal(),
            };

    const provision = this.provisionSignal();
    const isSkipProvisioning = provision.mode === 'SKIP';
    const isSelectAndroidBuild =
      this.basicFieldsSignal().mode === 'ANDROID_BUILD';
    const androidTestValues =
      this.basicFieldsSignal() as AndroidBuildBasicFields;
    const googleDriveTestValues =
      this.basicFieldsSignal() as GoogleDriveBasicFields;

    let testBranch = '',
      testTarget = '',
      testBuild = '';
    if (isSelectAndroidBuild) {
      testBranch = androidTestValues.buildValues.branch;
      testTarget = androidTestValues.buildValues.target;
      testBuild = androidTestValues.buildValues.build;
    } else {
      testBuild = googleDriveTestValues.zipFileId;
    }

    const settings = this.settings();
    const ctpTimeout = (
      settings.find(
        s => s.key === 'ctpTimeout' && s.format === 'inputBox'
      ) as InputBoxSetting
    ).state.value;
    const trTimeout = (
      settings.find(
        s => s.key === 'trTimeout' && s.format === 'inputBox'
      ) as InputBoxSetting
    ).state.value;
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

    const req: RunAndroidOSRequest = {
      os: 'android',
      board: board,
      model: model,
      pool: pool,
      skipProvisioning: isSkipProvisioning,
      target: isSkipProvisioning ? '' : provision.value.target,
      build: isSkipProvisioning ? testBuild : provision.value.build,
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
        tagsToInclude: ['suite:dts'],
        testNamesInclude: task.kind === 'testplan' ? [] : [task.name],
      },
      dims: {
        dut_name: hostname,
      },
      run: task,
      advanceSettings: {
        cft: true,
        trv2: true,
        uploadToCpcon: true,
        ctpTimeout: ctpTimeout,
        trTimeout: trTimeout,
        nShards: nShards,
        maxInShard: maxInShard,
      },
    };
    wrapperLoading(
      this.runService.run(req),
      this.isLoading,
      `Running ${testplan}...`
    )
      .pipe(
        startWithTap(() => {
          this.isRunLoadingSignal.set(true);
        }),
        finalize(() => {
          this.isRunLoadingSignal.set(false);
        })
      )
      .subscribe({
        next: link => {
          this.notification.info(
            [
              `Triggering ${task.name} succeed! Link:`,
              {type: 'url', url: link},
            ],
            {dismiss: false}
          );
        },
        error: e => {
          this.notification.error(`Trigger job failed: ${e}`, {dismiss: false});
        },
      });
  }
}
