import {SettingsComponent} from 'app/run_suite/common/settings/settings.component';
import {toIterator} from '../../../../app/utils/iterator';
import {IDut} from '../../../models/dut';
import {SelectableItem} from '../../../models/selectable_item';
import {AndroidService} from '../../../services/android.service';
import {
  RunAndroidOSRequest,
  RunService,
  Suite,
  Test,
  Testplan,
} from '../../../services/run.service';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  EffectRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {toObservable, takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  toSelectedItem,
  wrapperLoading,
  resetSignals,
} from '../../../../app/utils/operators';
import {
  CustomSetting,
  getDefaultCTPTimeout,
  getDefaultTrTimeout,
  getShardingGroup,
  getTestplanShardingGroup,
  InputBoxSetting,
  SingleChoiceSetting,
} from 'app/models/run_suite_fields';
import {NotificationService} from 'app/services/notification.service';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  from,
  of,
  switchMap,
} from 'rxjs';
import {CommonModule, NgIf} from '@angular/common';
import {LoadingComponent} from 'app/run_suite/common/loading/loading.component';
import {BasicSelectorComponent} from 'app/run_suite/common/basic-selector/basic-selector.component';
import {AutocompleteSelectorComponent} from 'app/run_suite/common/autocomplete-selector/autocomplete-selector.component';
import {SuiteComponent} from '../suite/suite.component';
import {TestPlanComponent} from '../test-plan/test-plan.component';
import {LoadingButtonComponent} from 'app/common/loading-button/loading-button.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {AndroidBuildPickerComponent} from '../android-build-picker/android-build-picker.component';
import {startWithTap} from 'app/utils/rxjs_operator';
import {ERROR_KEY_MSG_CONFIGS} from 'app/models/error';

@Component({
  selector: 'app-android-build-select-form',
  templateUrl: './android-build-select-form.component.html',
  styleUrls: ['./android-build-select-form.component.scss'],
  standalone: true,
  imports: [
    AutocompleteSelectorComponent,
    BasicSelectorComponent,
    CommonModule,
    LoadingButtonComponent,
    LoadingComponent,
    NgIf,
    SettingsComponent,
    SuiteComponent,
    TestPlanComponent,
    MatSlideToggleModule,
    AndroidBuildPickerComponent,
  ],
})
export class AndroidBuildSelectFormComponent
  implements AfterViewInit, OnDestroy
{
  protected tabSignal = signal<'suite' | 'test' | 'Testplan'>('suite');

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
  protected poolSignal = signal<string>('');
  protected suiteSignal = signal<string>('');

  protected isBuildValidSignal = signal<boolean>(true);
  protected testModulesSignal = signal<string[]>([]);
  protected testPlanSignal = signal<string>('');
  protected autoQualSignal = signal<boolean>(false);
  protected isRunLoadingSignal = signal<boolean>(false);
  protected targets = computed(() => Object.values(this.targetSignal()));

  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  protected loading$ = toObservable(this.isLoading);
  protected config = computed(() => ERROR_KEY_MSG_CONFIGS['common']);
  protected errMap = signal<{[key: string]: string}>({});
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

  protected sameBoardModels = computed(() => {
    const board = this.boardSignal();
    return this.duts()
      .filter(e => e.board === board)
      .map(e => e.model);
  });

  protected suiteTargetOptions = computed(() => {
    return toIterator(this.targetOptions())
      .filter(e => e.text.includes('test_suites'))
      .collect();
  });
  protected buildOptions = signal<SelectableItem[]>([]);
  protected suiteOptions = signal<SelectableItem[]>([]);
  protected testOptions = signal<SelectableItem[]>([]);

  protected isCrossBranchTestingSignal = signal<boolean>(false);

  protected testBranchSignal = signal<string>('');
  protected testTargetSignal = signal<string>('');
  protected testValidBuildSignal = signal<string>('');
  protected provisionBranchSignal = signal<string>('');
  protected provisionTargetSignal = signal<string>('');
  protected provisionValidBuildSignal = signal<string>('');

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

  protected customSettings = signal<CustomSetting[]>([...this.settings]);

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
  protected poolsOptions = computed(() => {
    return toIterator(this.duts())
      .filter(
        e =>
          e.board === this.boardSignal() &&
          (this.modelSignal() === '' || e.model === this.modelSignal())
      )
      .map(e => e.pools)
      .flatten()
      .unique_by()
      .map(e => toSelectedItem(e))
      .collect();
  });
  private suiteValidSignal = signal<boolean>(false);

  private refs: EffectRef[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(
    private androidService: AndroidService,
    private service: SatlabRpcService,
    private runService: RunService,
    private notification: NotificationService
  ) {
    this.refs = [
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
          if (board && branch && target.length > 1) {
            this.__onTargetChanged(board, branch, target);
          }
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          const board = untracked(() => this.boardSignal());
          const branch = untracked(() => this.branchSignal());
          const target = untracked(() => this.targets());
          const build = this.buildSignal();
          this.__onBuildChanged(board, branch, target, build);
        },
        {allowSignalWrites: true}
      ),
    ];
    // An observable that updates the CTP timeout and TR timeout based on the testplan.
    toObservable(this.testPlanSignal)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(testPlan => {
          if (testPlan === 'avs/component/storage') {
            return of([72, 48]);
          }
          return of([16, 16]);
        })
      )
      .subscribe(([timeout, trTimeout]) => {
        this.updateConfigs(timeout, trTimeout);
      });
  }

  ngAfterViewInit() {
    this.__listDuts();
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
  }

  protected onPropsChanged(key: string, value: string | string[]) {
    console.log(`${key}: ${value}`);
    switch (key) {
      case 'board':
        this.boardSignal.set((value as string).trim());
        resetSignals([
          this.modelSignal,
          this.branchSignal,
          this.buildSignal,
          this.validBuildSignal,
          this.poolSignal,
          this.suiteSignal,
          this.targetSignal,
          this.testModulesSignal,
          this.branchOptions,
          this.targetOptions,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
          this.errMap,
        ]);
        break;
      case 'model':
        resetSignals([
          this.branchSignal,
          this.buildSignal,
          this.validBuildSignal,
          this.poolSignal,
          this.suiteSignal,
          this.targetSignal,
          this.testModulesSignal,
          this.targetOptions,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
        ]);
        this.modelSignal.set((value as string).trim());
        break;
      case 'branch':
        resetSignals([
          this.buildSignal,
          this.validBuildSignal,
          this.suiteSignal,
          this.targetSignal,
          this.testModulesSignal,
          this.targetOptions,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
          this.errMap,
        ]);

        // Set the model value if users select the
        // model branch and didn't set the model value.
        for (const model of this.allModels()) {
          if (value.includes(model) && this.modelSignal() !== model) {
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
          this.suiteSignal,
          this.testModulesSignal,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
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
          this.suiteSignal,
          this.testModulesSignal,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
          this.errMap,
        ]);
        break;
      case 'build':
        this.buildSignal.set((value as string).trim());
        resetSignals([
          this.validBuildSignal,
          this.suiteSignal,
          this.testModulesSignal,
        ]);
        break;
      case 'pool':
        this.poolSignal.set((value as string).trim());
        break;
      case 'suite':
        this.suiteSignal.set((value as string).trim());
        resetSignals([this.testModulesSignal]);
        break;
      case 'testModules':
        this.testModulesSignal.set(value as string[]);
        break;
    }
  }

  protected onChildLoadingChanged(value: {show: boolean; message: string}) {
    this.isLoading.set(value);
  }

  protected onCrossBranchTestingChanged(value: boolean) {
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
      this.suiteSignal,
      this.testModulesSignal,
      this.branchOptions,
      this.targetOptions,
      this.buildOptions,
      this.suiteOptions,
      this.testOptions,
      this.errMap,
    ]);
    this.isCrossBranchTestingSignal.set(value);
  }

  protected onTabChanged(tab: 'suite' | 'test' | 'Testplan') {
    this.tabSignal.set(tab);
    this.settingsRef.resetShadringModeErrors();
    resetSignals([
      this.suiteSignal,
      this.testModulesSignal,
      this.testPlanSignal,
    ]);
    this.autoQualSignal.set(false);
    if (tab === 'Testplan') {
      // If selecting testplan, set the maxInShard to 10000 and make it immutable.
      this.customSettings.set([
        getDefaultCTPTimeout(),
        getDefaultTrTimeout(),
        getTestplanShardingGroup(),
      ]);
    } else {
      this.customSettings.set([
        getDefaultCTPTimeout(),
        getDefaultTrTimeout(),
        getShardingGroup(),
      ]);
    }
  }

  protected onChildSuiteValidChanged(value: boolean) {
    this.suiteValidSignal.set(value);
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

  protected _isRunnable = computed(() => {
    const extra =
      this.tabSignal() !== 'test' || this.testModulesSignal().length !== 0;

    const taskValid =
      this.tabSignal() === 'Testplan'
        ? this.testPlanSignal() !== ''
        : this.suiteValidSignal();

    const loading = this.isLoading();
    const hasFormError = Object.values(this.errMap()).some(e => e !== '');
    const errrorsFromSettings = this.settingsRef?.hasErrors() || false;
    const target = this.targetSignal();
    const isCrossBranch = this.isCrossBranchTestingSignal();
    const board = this.boardSignal();
    const pool = this.poolSignal();
    const branch = this.branchSignal(),
      build = this.validBuildSignal();
    const provisionBranch = this.provisionBranchSignal(),
      provisionTarget = this.provisionTargetSignal(),
      provisionBuild = this.provisionValidBuildSignal();
    const testBranch = this.testBranchSignal(),
      testTarget = this.testTargetSignal(),
      testBuild = this.testValidBuildSignal();

    console.log(
      `extra: ${extra}, loading: ${
        this.isLoading().show
      }, board: ${this.boardSignal()}, branch: ${this.branchSignal()}, provision branch: ${this.provisionBranchSignal()}, test branch: ${this.testBranchSignal()}, t1: ${
        this.targetSignal()[1]
      } t2: ${
        this.targetSignal()[2]
      }, provision build: ${this.provisionValidBuildSignal()}, test build: ${this.testValidBuildSignal()},
      provision target: ${this.provisionTargetSignal()}, test target: ${this.testTargetSignal()}, build: ${this.buildSignal()}, provision build: ${this.provisionValidBuildSignal()}, test build: ${this.testValidBuildSignal()}, pool: ${this.poolSignal()}, taskValid: ${taskValid}`
    );

    return (
      board !== '' &&
      pool !== '' &&
      (isCrossBranch
        ? provisionBranch !== '' &&
          testBranch !== '' &&
          provisionTarget !== '' &&
          testTarget !== '' &&
          provisionBuild !== '' &&
          testBuild !== ''
        : branch !== '' &&
          target[1] !== '' &&
          target[2] !== '' &&
          build !== '' &&
          this.isBuildValidSignal()) &&
      !hasFormError &&
      loading.show === false &&
      taskValid &&
      extra &&
      !errrorsFromSettings
    );
  });

  protected onBuildInputValueChanged(value: string) {
    this.onPropsChanged('build', value);
  }

  protected onCustomSettingsChanged(value: CustomSetting[]) {
    this.customSettings.set([...value]);
  }

  protected onPlanChanged(value: string) {
    this.testPlanSignal.set(value);
  }

  protected onAutoQualChanged(value: boolean) {
    this.autoQualSignal.set(value);
  }

  protected onRunClicked() {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const pool = this.poolSignal();
    const suite =
      this.tabSignal() === 'suite' ? `suite:${this.suiteSignal()}` : '';
    const testModules = this.testModulesSignal();
    const autoQual = this.autoQualSignal();
    const tab = this.tabSignal();
    const testplan = this.testPlanSignal();
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

    let testIncludes = [];
    let textExcludes = [];
    let tagIncludes = [];
    if (tab === 'test') {
      testIncludes = [...testModules];
    } else {
      textExcludes = [...testModules];
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

    const nShards = shardingMode.options.find(s => s.key === 'nShards')?.state
      .value;
    const maxInShard = shardingMode.options.find(s => s.key === 'maxInShard')
      ?.state.value;

    let task: Suite | Test | Testplan;
    if (tab === 'suite' || tab === 'test') {
      task = {
        kind: 'suite',
        name: suite,
      };
      if (suite !== '') {
        tagIncludes = [...tagIncludes, suite];
      }
    } else if (tab === 'Testplan') {
      task = {
        kind: 'testplan',
        name: testplan,
        autoQual: autoQual,
      };
    }

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
        testNamesExclude: textExcludes,
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
        startWithTap(() => this.isRunLoadingSignal.set(true)),
        finalize(() => this.isRunLoadingSignal.set(false))
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
    if (board !== '' && branch !== '' && targets.length > 0) {
      this.__listBuilds(board, branch, targets);
    }
  }

  private __onBuildChanged(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    if (board !== '' && branch !== '' && targets.length !== 0 && build !== '') {
      this.__isBuildValid(board, branch, targets, build);
    } else {
      this.validBuildSignal.set('');
    }
  }
  private __listBranches(targets: string[]) {
    console.log('calling list branches');
    wrapperLoading(
      this.androidService.listBranches(targets),
      this.isLoading,
      'Loading branches...'
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: e => {
          const {keys, msgs} = untracked(() => this.config());
          this.errMap.update(current => ({
            ...current,
            [keys.branch]: e.length === 0 ? msgs.branch : '',
          }));
          this.branchOptions.set(e.map(toSelectedItem));
        },
        error: e => {
          this.notification.error(`List branches failed: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  private __listTargets(branch: string) {
    console.log('Listing targets');
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
    console.log('list builds');
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
