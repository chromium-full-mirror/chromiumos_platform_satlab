import {LoadingButtonComponent} from '../../../common/loading-button/loading-button.component';
import {AutocompleteSelectorComponent} from '../../common/autocomplete-selector/autocomplete-selector.component';
import {BasicSelectorComponent} from '../../common/basic-selector/basic-selector.component';
import {LoadingComponent} from '../../common/loading/loading.component';
import {NgIf} from '@angular/common';
import {
  Component,
  EffectRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {IDut} from 'app/models/dut';
import {Suite, Testplan} from 'app/models/run';
import {RunAndroidOSRequest} from 'app/services/run.service';
import {SelectableItem} from 'app/models/selectable_item';
import {AndroidService} from 'app/services/android.service';
import {NotificationService} from 'app/services/notification.service';
import {RunService} from 'app/services/run.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {toIterator} from 'app/utils/iterator';
import {
  resetSignals,
  toSelectedItem,
  wrapperLoading,
} from 'app/utils/operators';
import {startWithTap} from 'app/utils/rxjs_operator';
import {finalize, from} from 'rxjs';
import {SettingsComponent} from 'app/run_suite/common/settings/settings.component';
import {
  CustomSetting,
  getDefaultCTPTimeout,
  getDefaultTrTimeout,
  InputBoxSetting,
  SingleChoiceSetting,
  getTestplanShardingGroup,
} from 'app/models/run_suite_fields';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {AndroidBuildPickerComponent} from '../android-build-picker/android-build-picker.component';
import {ERROR_KEY_MSG_CONFIGS} from 'app/models/error';

@Component({
  selector: 'app-pvs',
  templateUrl: './pvs.component.html',
  styleUrls: ['./pvs.component.scss'],
  standalone: true,
  imports: [
    AutocompleteSelectorComponent,
    BasicSelectorComponent,
    MatSlideToggleModule,
    LoadingComponent,
    LoadingButtonComponent,
    NgIf,
    SettingsComponent,
    AndroidBuildPickerComponent,
  ],
})
export class PvsComponent implements OnInit, OnDestroy {
  protected boardSignal = signal<string>('');
  protected allModels = computed(() => {
    const board = this.boardSignal();
    return toIterator(this.duts())
      .filter(e => e.board === board)
      .map(e => e.model)
      .collect();
  });
  protected modelSignal = signal<string>('');
  protected branchSignal = signal<string>('');
  protected targetSignal = signal<{[key: number]: string}>({1: '', 2: ''});
  protected buildSignal = signal<string>('');
  protected validBuildSignal = signal<string>('');

  protected hostnameSignal = signal<string>('');
  protected isRunLoadingSignal = signal<boolean>(false);
  protected combinedErrorMsg = computed(() => {
    const parentErrors = Object.values(this.errMap());
    const provision = this._provisionPicker();
    const test = this._testPicker();

    const provisionErrors = provision ? Object.values(provision.errMap()) : [];
    const testErrors = test ? Object.values(test.errMap()) : [];

    return [...parentErrors, ...provisionErrors, ...testErrors]
      .filter(msg => msg !== '')
      .join(' | ');
  });
  protected targets = computed(() => Object.values(this.targetSignal()));
  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  protected loading$ = toObservable(this.isLoading);

  protected branchOptions = signal<SelectableItem[]>([]);
  protected targetOptions = signal<SelectableItem[]>([]);
  // Filter branch options based on model.
  // If model is present, include branches that include the model or exclude all other models with the same board.
  // If model is not present, include branches that include any model with the same board.
  protected filteredBranchOptions = computed(() => {
    const model = this.modelSignal();
    const branchOptions = this.branchOptions();
    const notSelectedModels = this.sameBoardModels().filter(e => e !== model);
    if (branchOptions.length === 0) return [];
    return branchOptions.filter(
      e =>
        e.text.includes(model) ||
        notSelectedModels.every(m => !e.text.includes(m))
    );
  });
  protected sameBoardModels = computed(() => {
    const board = this.boardSignal();
    return this.duts()
      .filter(e => e.board === board)
      .map(e => e.model);
  });

  protected boardTargetOptions = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const sameBoardModels = this.sameBoardModels();

    const targetOptions = this.targetOptions();
    if (targetOptions.length === 0) return [];
    // If not test, model is present, show targets that include board or model and not test_suites.
    if (model) {
      return targetOptions.filter(
        e =>
          (e.text.includes(board) || e.text.includes(model)) &&
          !e.text.includes('test_suites')
      );
    }
    // If not test, model is not present, show targets that include board or any connected model and not test_suites.
    return targetOptions.filter(
      e =>
        (e.text.includes(board) ||
          sameBoardModels.some(m => e.text.includes(m))) &&
        !e.text.includes('test_suites')
    );
  });
  protected suiteTargetOptions = computed(() => {
    return toIterator(this.targetOptions())
      .filter(e => e.text.includes('test_suites'))
      .collect();
  });
  protected hostnameOptions = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    return toIterator(this.duts())
      .filter(e => e.board === board && (model === '' || e.model === model))
      .map(e => toSelectedItem(e.hostname))
      .collect();
  });
  protected buildOptions = signal<SelectableItem[]>([]);

  protected duts = signal<IDut[]>([]);
  protected boardOptions = computed(() => {
    return toIterator(this.duts())
      .unique_by_where((a, b) => a.board === b.board)
      .map(e => toSelectedItem(e.board))
      .collect();
  });
  protected modelsOptions = computed(() => {
    return toIterator(this.duts())
      .filter(e => e.board === this.boardSignal())
      .unique_by_where((a, b) => {
        return a.model === b.model;
      })
      .map(e => toSelectedItem(e.model))
      .collect();
  });
  protected tabSignal = signal<'storage' | 'memory'>('storage');
  protected testTypeSignal = signal<'testplan' | 'test'>('testplan');
  protected testPlanSignal = computed(() => {
    switch (this.tabSignal()) {
      case 'storage':
        return this.STORAGE_TESTPLAN_NAME;
      case 'memory':
        return this.MEMORY_TESTPLAN_NAME;
      default:
        return '';
    }
  });
  protected testNameSignal = signal<string>('');
  protected testOptions = computed(() => {
    return this.tabSignal() === 'storage'
      ? toIterator(this.STORAGE_TEST_NAMES).map(toSelectedItem).collect()
      : toIterator(this.MEMORY_TEST_NAMES).map(toSelectedItem).collect();
  });

  private suiteValidSignal = signal<boolean>(false);
  private MEMORY_TESTPLAN_NAME = 'avs/component/memory';
  private STORAGE_TESTPLAN_NAME = 'avs/component/storage';
  private STORAGE_TEST_NAMES = [
    'tradefed.dts.DesktopStorageAvlHostTestCases',
    'tradefed.dts.DesktopStorageTestCasesStress',
  ];
  private MEMORY_TEST_NAMES = [];

  private refs: EffectRef[] = [];

  protected defaultSettings = [
    getDefaultCTPTimeout(),
    getDefaultTrTimeout(),
    getTestplanShardingGroup(),
  ];

  protected settings = signal<CustomSetting[]>([...this.defaultSettings]);

  protected isCrossBranchTestingSignal = signal<boolean>(false);
  private errMap = signal<{[key: string]: string}>({});
  protected config = computed(() => ERROR_KEY_MSG_CONFIGS['common']);
  private testBranchSignal = signal<string>('');
  private testTargetSignal = signal<string>('');
  private testValidBuildSignal = signal<string>('');
  private provisionBranchSignal = signal<string>('');
  private provisionTargetSignal = signal<string>('');
  private provisionValidBuildSignal = signal<string>('');

  protected provisionTarget = computed(() => {
    return this.isCrossBranchTestingSignal()
      ? this.provisionTargetSignal()
      : this.targetSignal()[1];
  });

  protected testTarget = computed(() => {
    return this.isCrossBranchTestingSignal()
      ? this.testTargetSignal()
      : this.targetSignal()[2];
  });

  protected buildForListingSuite = computed(() => {
    return this.isCrossBranchTestingSignal()
      ? this.testValidBuildSignal()
      : this.validBuildSignal();
  });

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

  constructor(
    private androidService: AndroidService,
    private runService: RunService,
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {
    this.refs = [
      effect(
        () => {
          this.__onSingleChoiceChanged(this.tabSignal());
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          const board = this.boardSignal();
          const isCrossBranch = this.isCrossBranchTestingSignal();

          if (board !== '' && !isCrossBranch) {
            this.__onBoardChanged(board);
          }
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          this.__onBranchChanged(this.branchSignal());
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          const board = untracked(() => this.boardSignal());
          const branch = untracked(() => this.branchSignal());
          const target = this.targets();
          this.__onTargetChanged(board, branch, target);
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          const board = untracked(() => this.boardSignal());
          const branch = untracked(() => this.branchSignal());
          const target = untracked(() => this.targets());
          const build = this.buildSignal().trim();
          if (
            board !== '' &&
            branch !== '' &&
            build !== '' &&
            target[1] !== '' &&
            target[2] !== ''
          ) {
            this.__onBuildChanged(board, branch, target, build);
          }
        },
        {allowSignalWrites: true}
      ),
    ];
  }

  ngOnInit() {
    this.updateConfigs(72, 48);
    this.__listDuts();
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
  }

  protected onPropsChanged(
    key: string,
    value: string | string[] | CustomSetting[]
  ) {
    switch (key) {
      case 'tab':
        this.tabSignal.set(value as 'storage' | 'memory');
        resetSignals([this.testNameSignal]);
        break;
      case 'board':
        this.boardSignal.set((value as string).trim());
        resetSignals([
          this.modelSignal,
          this.branchSignal,
          this.buildSignal,
          this.validBuildSignal,
          this.targetSignal,
          this.hostnameSignal,
          this.branchOptions,
          this.targetOptions,
          this.buildOptions,
          this.errMap,
        ]);
        break;
      case 'model':
        resetSignals([
          this.branchSignal,
          this.buildSignal,
          this.validBuildSignal,
          this.targetSignal,
          this.hostnameSignal,
          this.targetOptions,
          this.buildOptions,
        ]);
        this.modelSignal.set((value as string).trim());
        break;
      case 'branch':
        resetSignals([
          this.buildSignal,
          this.validBuildSignal,
          this.targetSignal,
          this.targetOptions,
          this.buildOptions,
          this.errMap,
        ]);

        // Set the model value if users select the
        // model branch and didn't set the model value.
        for (const model of this.allModels()) {
          if (
            (value as string[]).includes(model) &&
            this.modelSignal() !== model
          ) {
            this.modelSignal.set(model);
          }
        }

        this.branchSignal.set((value as string).trim());
        break;
      case 'boardTarget':
        this.targetSignal.set({
          ...this.targetSignal(),
          1: (value as string).trim(),
        });
        resetSignals([
          this.buildSignal,
          this.validBuildSignal,
          this.buildOptions,
          this.errMap,
        ]);
        break;
      case 'suiteTarget':
        this.targetSignal.set({
          ...this.targetSignal(),
          2: (value as string).trim(),
        });
        resetSignals([
          this.buildSignal,
          this.validBuildSignal,
          this.buildOptions,
          this.errMap,
        ]);
        break;
      case 'hostname':
        this.hostnameSignal.set((value as string).trim());
        break;
      case 'build':
        const build = this.buildSignal();
        if (value === build) break;
        this.buildSignal.set((value as string).trim());
        resetSignals([this.validBuildSignal]);
        break;
      case 'testType':
        this.testTypeSignal.set(value as 'testplan' | 'test');
        resetSignals([this.testNameSignal]);
        break;
      case 'test':
        this.testNameSignal.set((value as string).trim());
        break;
    }
  }

  protected onChildLoadingChanged(value: {show: boolean; message: string}) {
    this.isLoading.set(value);
  }

  protected onChildSuiteValidChanged(value: boolean) {
    this.suiteValidSignal.set(value);
  }

  protected onTestInputValueChanged(value: string) {
    this.testNameSignal.set(value);
  }

  protected onCustomSettingsChanged(value: CustomSetting[]) {
    this.settings.set([...value]);
  }

  protected _isRunnable = computed(() => {
    const settingsHaveErrors = this.settingsRef?.hasErrors();
    const loading = this.isLoading();
    const hasFormError = Object.values(this.errMap()).some(e => e !== '');
    const target = this.targetSignal();
    const isCrossBranch = this.isCrossBranchTestingSignal();
    const validBoard = this.boardSignal() !== '';
    const branch = this.branchSignal();
    const build = this.validBuildSignal();
    const provisionBranchValid = this.provisionBranchSignal() !== '';
    const provisionTargetValid = this.provisionTargetSignal() !== '';
    const provisionBuildValid = this.provisionValidBuildSignal() !== '';
    const testBranchValid = this.testBranchSignal() !== '';
    const testTargetValid = this.testTargetSignal() !== '';
    const testBuildValid = this.testValidBuildSignal() !== '';
    const hostnameValid = this.hostnameSignal() !== '';
    const testValid =
      this.testTypeSignal() !== 'test' || this.testNameSignal() !== '';

    console.log(
      `validBoard: ${validBoard}, branch: ${branch}, build: ${build}, provisionBranchValid: ${provisionBranchValid}, provisionTargetValid: ${provisionTargetValid}, provisionBuildValid: ${provisionBuildValid}, testBranchValid: ${testBranchValid}, testTargetValid: ${testTargetValid}, testBuildValid: ${testBuildValid}, hostnameValid: ${hostnameValid}, testValid: ${testValid}, settingsHaveErrors: ${settingsHaveErrors}, hasFormError: ${hasFormError}`
    );

    return (
      validBoard &&
      (isCrossBranch
        ? provisionBranchValid &&
          provisionTargetValid &&
          provisionBuildValid &&
          testBranchValid &&
          testTargetValid &&
          testBuildValid
        : branch !== '' &&
          target[1] !== '' &&
          target[2] !== '' &&
          build !== '') &&
      hostnameValid &&
      loading.show === false &&
      testValid &&
      !settingsHaveErrors &&
      !hasFormError
    );
  });

  protected onBuildInputValueChanged(value: string) {
    this.onPropsChanged('build', value);
  }

  protected onAndroidBranchTargetBuildChanged(value: {
    type: 'provision' | 'test';
    branch: string;
    target: string;
    validBuild: string;
  }) {
    if (value.type === 'test') {
      this.testBranchSignal.set(value.branch);
      this.testTargetSignal.set(value.target);
      this.testValidBuildSignal.set(value.validBuild);
    } else if (value.type === 'provision') {
      this.provisionBranchSignal.set(value.branch);
      this.provisionTargetSignal.set(value.target);
      this.provisionValidBuildSignal.set(value.validBuild);
    }
  }

  protected onCrossBranchTestingChanged(value: boolean) {
    this.isCrossBranchTestingSignal.set(value);
    resetSignals([
      this.testBranchSignal,
      this.testTargetSignal,
      this.testValidBuildSignal,
      this.provisionBranchSignal,
      this.provisionTargetSignal,
      this.provisionValidBuildSignal,
      this.branchSignal,
      this.targetSignal,
      this.buildSignal,
      this.branchOptions,
      this.targetOptions,
      this.buildOptions,
      this.errMap,
    ]);
  }

  onRunClicked() {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const hostname = this.hostnameSignal();
    const pool = toIterator(this.duts()).first_where(
      e => e.hostname === hostname
    ).pools[0];
    const testplan = this.testPlanSignal();
    const test = this.testNameSignal();
    const testType = this.testTypeSignal();

    const isCrossBranch = this.isCrossBranchTestingSignal() ?? false;
    const provisionTarget = isCrossBranch
      ? this.provisionTargetSignal()
      : this.targetSignal()[1];
    const testTarget = isCrossBranch
      ? this.testTargetSignal()
      : this.targetSignal()[2];

    const provisionBuild = isCrossBranch
      ? this.provisionValidBuildSignal()
      : this.buildForListingSuite();
    const testBuild = isCrossBranch ? this.testValidBuildSignal() : '';
    const testBranch = this.testBranchSignal();

    const task: Testplan | Suite =
      testType === 'testplan'
        ? {
            kind: 'testplan',
            name: testplan,
          }
        : {
            kind: 'suite',
            name: test,
          };

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

    const nShards = shardingMode.options.find(s => s.key === 'nShards')?.state
      .value;
    const maxInShard = shardingMode.options.find(s => s.key === 'maxInShard')
      ?.state.value;

    const req: RunAndroidOSRequest = {
      os: 'android',
      board: board,
      model: model,
      pool: pool,
      target: provisionTarget,
      test_target: testTarget,
      build: provisionBuild,
      test_build: testBuild,
      test_branch: testBranch,
      tags: {
        tagsToInclude: ['suite:dts'],
        testNamesInclude: testType === 'test' ? [test] : [],
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
        startWithTap(() => this.isRunLoadingSignal.set(true)),
        finalize(() => this.isRunLoadingSignal.set(false))
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

  private __onSingleChoiceChanged(tab: 'storage' | 'memory') {
    if (tab === 'memory') {
      this.testTypeSignal.set('testplan');
    }
  }

  private __onBoardChanged(board: string) {
    if (board) {
      this.__listBranches([...this.allModels(), board]);
    }
  }

  private __onBranchChanged(branch: string) {
    if (branch) {
      this.__listTargets(branch);
    }
  }

  private __onTargetChanged(board: string, branch: string, targets: string[]) {
    if (
      board !== '' &&
      branch !== '' &&
      toIterator(targets)
        .filter(t => t.trim() !== '')
        .collect().length > 1
    ) {
      this.__listBuilds(board, branch, targets);
    }
  }

  private __onBuildChanged(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    if (board !== '' && branch !== '' && targets.length !== 0) {
      this.__isBuildValid(board, branch, targets, build);
    }
  }

  private __listBranches(targets: string[]) {
    wrapperLoading(
      this.androidService.listBranches(targets),
      this.isLoading,
      'Loading branches...'
    ).subscribe({
      next: e => {
        const {keys, msgs} = untracked(() => this.config());
        this.errMap.update(current => ({
          ...current,
          [keys.branch]: e.length === 0 ? msgs.branch : '',
        }));
        this.branchOptions.set(e.map(toSelectedItem));
      },
      error: e => {
        this.notification.error(`List branches failed: ${e}`, {dismiss: false});
      },
    });
  }

  private __listTargets(branch: string) {
    wrapperLoading(
      this.androidService.listTargets(branch),
      this.isLoading,
      'Loading targets...'
    ).subscribe({
      next: e => {
        const {keys, msgs} = untracked(() => this.config());
        this.errMap.update(current => ({
          ...current,
          [keys.target]: e.length === 0 ? msgs.target : '',
        }));
        this.targetOptions.set(e.map(toSelectedItem));
      },
      error: e => {
        this.notification.error(`List targets failed: ${e}`, {dismiss: false});
      },
    });
  }

  private __listBuilds(board: string, branch: string, targets: string[]) {
    wrapperLoading(
      this.androidService.listBuilds(board, branch, targets),
      this.isLoading,
      'Loading builds...'
    ).subscribe({
      next: e => {
        const {keys, msgs} = untracked(() => this.config());
        this.errMap.update(current => ({
          ...current,
          [keys.build]: e.length === 0 ? msgs.build : '',
        }));
        this.buildOptions.set(e.map(toSelectedItem));
      },
      error: e => {
        this.notification.error(`List builds failed: ${e}`, {dismiss: false});
      },
    });
  }

  private __listDuts() {
    wrapperLoading(
      from(this.service.listEnrolledDUTs()),
      this.isLoading,
      'Loading DUTs...'
    ).subscribe({
      next: e => {
        const {keys, msgs} = untracked(() => this.config());
        this.errMap.update(current => ({
          ...current,
          [keys.listDut]: e.length === 0 ? msgs.listDut : '',
        }));
        this.duts.set(e);
      },
      error: e => {
        this.notification.error(`List DUTs failed: ${e}`, {dismiss: false});
      },
    });
  }

  private __isBuildValid(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    wrapperLoading(
      this.androidService.validateBuild(board, branch, targets, build),
      this.isLoading,
      'Validating build...'
    ).subscribe({
      next: isValid => {
        const {keys, msgs} = untracked(() => this.config());
        if (isValid) {
          this.validBuildSignal.set(build);
          this.errMap.update(current => ({
            ...current,
            [keys.validate]: '',
          }));
          this.errMap.update(current => ({
            ...current,
            [keys.build]: '',
          }));
        } else {
          this.errMap.update(current => ({
            ...current,
            [keys.validate]: msgs.validate,
          }));
        }
      },
      error: e => {
        this.notification.error(`Validate build failed: ${e}`, {
          dismiss: false,
        });
      },
    });
  }
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
}
