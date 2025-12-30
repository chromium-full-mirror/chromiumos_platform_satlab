import {LoadingButtonComponent} from '../../../common/loading-button/loading-button.component';
import {AutocompleteSelectorComponent} from '../../common/autocomplete-selector/autocomplete-selector.component';
import {BasicSelectorComponent} from '../../common/basic-selector/basic-selector.component';
import {LoadingComponent} from '../../common/loading/loading.component';
import {NgIf} from '@angular/common';
import {
  AfterViewInit,
  Component,
  EffectRef,
  OnDestroy,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {IDut} from 'app/models/dut';
import {RunAndroidOSRequest, Suite, Testplan} from 'app/models/run';
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

@Component({
  selector: 'app-pvs',
  templateUrl: './pvs.component.html',
  styleUrls: ['./pvs.component.scss'],
  standalone: true,
  imports: [
    LoadingComponent,
    BasicSelectorComponent,
    AutocompleteSelectorComponent,
    LoadingButtonComponent,
    NgIf,
  ],
})
export class PvsComponent implements AfterViewInit, OnDestroy {
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
  protected notAvailableMsg = signal<string>('');
  protected targets = computed(() => Object.values(this.targetSignal()));
  private target = computed(() => {
    return toIterator(this.targets()).first_where(
      e => !e.includes('test_suites')
    );
  });

  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  protected loading$ = toObservable(this.isLoading);

  protected branchOptions = signal<SelectableItem[]>([]);
  protected targetOptions = signal<SelectableItem[]>([]);
  protected boardTargetOptions = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    return toIterator(this.targetOptions())
      .filter(
        e =>
          (e.text.includes(board) || e.text.includes(model)) &&
          !e.text.includes('test_suites')
      )
      .collect();
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

  constructor(
    private androidService: AndroidService,
    private runService: RunService,
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {
    this.refs = [
      effect(
        () => {
          this.__onTabChanged(this.tabSignal());
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          this.__onBoardChanged(this.boardSignal());
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
          if (build !== '') {
            this.__onBuildChanged(board, branch, target, build);
          }
        },
        {allowSignalWrites: true}
      ),
    ];
  }

  ngAfterViewInit() {
    this.__listDuts();
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
  }

  protected onPropsChanged(key: string, value: string | string[]) {
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
          this.notAvailableMsg,
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
          this.notAvailableMsg,
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
          this.notAvailableMsg,
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
          this.buildOptions,
          this.notAvailableMsg,
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
          this.notAvailableMsg,
        ]);
        break;
      case 'hostname':
        this.hostnameSignal.set((value as string).trim());
        break;
      case 'build':
        const build = this.buildSignal();
        if (value === build) break;
        this.buildSignal.set((value as string).trim());
        resetSignals([this.validBuildSignal, this.notAvailableMsg]);
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

  protected _isRunnable = computed(() => {
    return (
      this.isLoading().show === false &&
      this.boardSignal() &&
      this.branchSignal() &&
      this.targetSignal()[1] !== '' &&
      this.targetSignal()[2] !== '' &&
      this.target() &&
      this.buildSignal() !== '' &&
      this.validBuildSignal() !== '' &&
      this.hostnameSignal() !== '' &&
      this.notAvailableMsg() === '' &&
      (this.testTypeSignal() !== 'test' || this.testNameSignal() !== '')
    );
  });

  protected onBuildInputValueChanged(value: string) {
    this.onPropsChanged('build', value);
  }

  onRunClicked() {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const build = this.validBuildSignal();
    const hostname = this.hostnameSignal();
    const pool = toIterator(this.duts()).first_where(
      e => e.hostname === hostname
    ).pools[0];
    const testplan = this.testPlanSignal();
    const test = this.testNameSignal();
    const testType = this.testTypeSignal();
    const target = this.target();
    const testTarget = this.targetSignal()[2];
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

    const req: RunAndroidOSRequest = {
      os: 'android',
      board: board,
      model: model,
      pool: pool,
      target: target,
      test_target: testTarget,
      build: build,
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

  private __onTabChanged(tab: 'storage' | 'memory') {
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
    if (
      board !== '' &&
      branch !== '' &&
      targets.length !== 0 &&
      /^\d{8}$/.test(build)
    ) {
      this.__isBuildValid(board, branch, targets, build);
    } else {
      this.notAvailableMsg.set(
        'Make sure board, branch, targets exist, and build should be 8 digit nubmer.'
      );
    }
  }

  private __listBranches(targets: string[]) {
    wrapperLoading(
      this.androidService.listBranches(targets),
      this.isLoading,
      'Loading branches...'
    ).subscribe({
      next: e => {
        this.notAvailableMsg.set(e.length === 0 ? 'No branches available' : '');
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
        this.notAvailableMsg.set(e.length === 0 ? 'No targets available' : '');
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
        this.notAvailableMsg.set(e.length === 0 ? 'No builds available' : '');
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
        if (isValid) {
          this.validBuildSignal.set(build);
        } else {
          this.notAvailableMsg.set(
            'The build is invalid, please choose another one.'
          );
        }
      },
      error: e => {
        this.notification.error(`Validate build failed: ${e}`, {
          dismiss: false,
        });
      },
    });
  }
}
