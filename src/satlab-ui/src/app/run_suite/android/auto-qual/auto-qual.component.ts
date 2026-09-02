import {TableCellComponent} from '../../common/table-cell/table-cell.component';
import {toSelectedItem} from 'app/utils/operators';
import {CommonModule} from '@angular/common';
import {
  Component,
  EffectRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {IDut} from 'app/models/dut';
import {SelectableItem} from 'app/models/selectable_item';
import {AutocompleteComponent} from 'app/run_suite/common/autocomplete/autocomplete.component';
import {BasicSelectorComponent} from 'app/run_suite/common/basic-selector/basic-selector.component';
import {LoadingComponent} from 'app/run_suite/common/loading/loading.component';
import {AndroidService} from 'app/services/android.service';
import {NotificationService} from 'app/services/notification.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {TestEffort} from 'app/services/satlabrpc_pb';
import {toIterator} from 'app/utils/iterator';
import {resetSignals, wrapperLoading} from 'app/utils/operators';
import {from} from 'rxjs';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {ALBuildBasic, ICustomSettings} from 'app/models/run_suite_fields';
import {AdvancedSettingsComponent} from 'app/run_suite/common/advanced-settings/advanced-settings.component';
import {AndroidBuildPickerComponent} from '../../android/common/android-build-picker/android-build-picker.component';

export enum Status {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In progress',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Component({
  selector: 'app-auto-qual',
  imports: [
    CommonModule,
    TableCellComponent,
    MatProgressSpinnerModule,
    LoadingComponent,
    BasicSelectorComponent,
    AutocompleteComponent,
    RouterModule,
    MatSlideToggleModule,
    AndroidBuildPickerComponent,
    AdvancedSettingsComponent,
  ],
  templateUrl: './auto-qual.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./auto-qual.component.scss'],
})
export class AutoQualComponent implements OnInit, OnDestroy {
  protected readonly ALL_COLUMNS = [
    'id',
    'target',
    'buildID',
    'pool',
    'testplan',
    'createdAt',
    'status',
    'resultsLink',
    'actions',
  ];
  protected COLUMN_NAME_MAP: Record<string, string> = {
    id: 'Request ID',
    target: 'Target',
    buildID: 'Build ID',
    pool: 'Pool',
    testplan: 'TestPlan/Suite',
    createdAt: 'Created At',
    status: 'Status',
    progress: 'Progress',
    jobLink: 'Job Link',
    resultsLink: 'Results Link',
    actions: 'Actions',
  };

  protected isViewTestEffotLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  protected isScheduleRunLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected scheduleRunloading$ = toObservable(this.isScheduleRunLoading);

  protected selectedColumns = signal<string[]>([...this.ALL_COLUMNS]);
  protected displayedColumns = computed(() => {
    const selected = this.selectedColumns();
    return this.ALL_COLUMNS.filter(col => selected.includes(col));
  });

  protected testRecords = signal<AutoQualTestRecord[]>([]);
  protected isMenuOpen = signal<boolean>(false);

  protected isScheduleRun = signal<boolean>(false);

  protected dutsSignal = signal<IDut[]>([]);
  protected boardSignal = signal<string>('');
  protected boardOptions = computed(() => {
    return toIterator(this.dutsSignal())
      .unique_by_where((a, b) => a.board === b.board)
      .map(dut => toSelectedItem(dut.board))
      .collect();
  });
  protected allModels = computed(() => {
    const board = this.boardSignal();
    return toIterator(this.dutsSignal())
      .filter(dut => dut.board === board)
      .map(dut => dut.model)
      .unique_by_where((a, b) => a === b)
      .collect();
  });
  protected modelSignal = signal<string>('');
  protected modelOptions = computed(() => {
    const duts = this.dutsSignal();
    const board = this.boardSignal();
    return toIterator(duts)
      .filter(dut => dut.board === board)
      .unique_by_where((a, b) => a.model === b.model)
      .map(dut => toSelectedItem(dut.model))
      .collect();
  });
  protected branchSignal = signal<string>('');
  protected branchOptions = signal<SelectableItem[]>([]);
  protected filteredBranchOptions = computed(() => {
    const model = this.modelSignal();
    const branches = this.branchOptions();
    const allModels = this.allModels();
    return model === ''
      ? branches
      : toIterator(branches)
          .filter(b => {
            return allModels.every(m => m === model || !b.text.includes(m));
          })
          .collect();
  });
  protected targetOptions = signal<SelectableItem[]>([]);
  protected boardTargetSignal = signal<string>('');
  protected boardTargetOptions = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const targets = this.targetOptions();
    return toIterator(targets)
      .filter(t => {
        const target = t.text as string;
        return (
          (target.includes(board) || target.includes(model)) &&
          !target.includes('test_suites')
        );
      })
      .collect();
  });
  protected testTargetOptions = computed(() => {
    return toIterator(this.targetOptions())
      .filter(e => e.text.includes('test_suites'))
      .collect();
  });
  protected poolSignal = signal<string>('');
  protected poolOptions = computed(() => {
    const duts = this.dutsSignal();
    const board = this.boardSignal();
    const model = this.modelSignal();
    return toIterator(duts)
      .filter(
        dut => dut.board === board && (model === '' || dut.model === model)
      )
      .map(dut => dut.pools)
      .flatten()
      .unique_by()
      .map(p => toSelectedItem(p))
      .collect();
  });
  protected buildSignal = signal<string>('');
  protected buildOptions = signal<SelectableItem[]>([]);
  protected validBuildSignal = signal<string>('');
  protected testplanSignal = signal<string>('');

  protected isCrossBranchSignal = signal<boolean>(false);
  protected skipBootPrerequisiteSignal = signal<boolean>(true);
  protected customSettings: ICustomSettings = {
    skipBootPrerequisite: true,
  };
  protected testBranchSignal = signal<string>('');
  protected testTargetSignal = signal<string>('');
  protected testValidBuildSignal = signal<string>('');

  protected notAvailableMsg = signal<string>('');

  protected isRunnable = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const branch = this.branchSignal();
    const boardTarget = this.boardTargetSignal();
    const pool = this.poolSignal();
    const build = this.buildSignal();
    const validBuild = this.validBuildSignal();
    const testplan = this.testplanSignal();
    const errMsg = this.notAvailableMsg();

    const isCrossBranch = this.isCrossBranchSignal();
    const testBranch = this.testBranchSignal();
    const testTarget = this.testTargetSignal();
    const testValidBuild = this.testValidBuildSignal();

    const crossBranchValid = isCrossBranch
      ? testBranch !== '' && testTarget !== '' && testValidBuild !== ''
      : testTarget !== '';

    return (
      board !== '' &&
      model !== '' &&
      branch !== '' &&
      boardTarget !== '' &&
      pool !== '' &&
      build !== '' &&
      validBuild !== '' &&
      testplan !== '' &&
      crossBranchValid &&
      !errMsg
    );
  });

  private readonly PAGE_SIZE = 20;
  private readonly SCROLL_BOTTOM_DIFF = 5;
  private pageToken = signal<string>('');
  private isEndOfList = signal<boolean>(false);
  private readonly STATE_MAPPING: Partial<Record<TestEffort.State, Status>> = {
    [TestEffort.State.STATE_UNSPECIFIED]: Status.SCHEDULED,
    [TestEffort.State.CREATED]: Status.SCHEDULED,
    [TestEffort.State.INCOMPLETE]: Status.IN_PROGRESS,
    [TestEffort.State.FAILED]: Status.FAILED,
    [TestEffort.State.UNREPORTED]: Status.IN_PROGRESS,
    [TestEffort.State.SUCCEEDED]: Status.COMPLETED,
    [TestEffort.State.CANCEL_REQUESTED]: Status.CANCELLED,
    [TestEffort.State.CANCELLED]: Status.CANCELLED,
    [TestEffort.State.CANCEL_FAILED]: Status.CANCELLED,
  };

  private readonly notCancelableStatus: Status[] = [
    Status.FAILED,
    Status.CANCELLED,
    Status.COMPLETED,
  ];

  private refs: EffectRef[] = [];

  constructor(
    private androidService: AndroidService,
    private rpcService: SatlabRpcService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.refs = [
      effect(() => {
        this.__onBoardChanged(this.boardSignal());
      }),
      effect(() => {
        this.__onBranchChanged(this.branchSignal());
      }),
      effect(() => {
        const board = untracked(() => this.boardSignal());
        const branch = untracked(() => this.branchSignal());
        const boardTarget = this.boardTargetSignal();
        const testTarget = this.testTargetSignal();
        const isCrossBranch = this.isCrossBranchSignal();
        const targets = isCrossBranch
          ? [boardTarget]
          : [boardTarget, testTarget];
        if (board !== '' && branch !== '' && !targets.includes('')) {
          this.__listBuilds(board, branch, targets);
        }
      }),
    ];
  }

  ngOnInit() {
    this.__listTestEfforts(this.PAGE_SIZE, this.pageToken());
    this.__listDuts();

    this.route.url.subscribe(url => {
      const isSchedule = url.some(segment => segment.path === 'schedule');
      this.isScheduleRun.set(isSchedule);
    });
  }

  ngOnDestroy(): void {
    this.refs.forEach(ref => ref.destroy());
  }

  protected trackById(_: number, record: AutoQualTestRecord) {
    return record.id.str;
  }
  protected trackByCol(_: number, col: string) {
    return col;
  }

  protected onPropsChanged(key: string, value: string) {
    console.log(`key: ${key}, value:${value}`);
    switch (key) {
      case 'board':
        this.boardSignal.set((value as string).trim());
        resetSignals([
          this.modelSignal,
          this.branchSignal,
          this.boardTargetSignal,
          this.poolSignal,
          this.buildSignal,
          this.validBuildSignal,
          this.branchOptions,
          this.targetOptions,
          this.buildOptions,
          this.notAvailableMsg,
          this.testTargetSignal,
        ]);
        break;
      case 'model':
        this.modelSignal.set((value as string).trim());
        resetSignals([
          this.branchSignal,
          this.boardTargetSignal,
          this.validBuildSignal,
          this.buildSignal,
          this.poolSignal,
          this.targetOptions,
          this.buildOptions,
          this.testTargetSignal,
        ]);
        break;
      case 'branch':
        this.branchSignal.set((value as string).trim());
        resetSignals([
          this.boardTargetSignal,
          this.buildSignal,
          this.validBuildSignal,
          this.targetOptions,
          this.buildOptions,
          this.notAvailableMsg,
          this.testTargetSignal,
        ]);

        this.allModels().forEach(m => {
          if (value.includes(m) && this.modelSignal() !== m) {
            this.modelSignal.set(m);
          }
        });
        break;
      case 'boardTarget':
        this.boardTargetSignal.set((value as string).trim());
        resetSignals([
          this.buildSignal,
          this.validBuildSignal,
          this.buildOptions,
          this.notAvailableMsg,
        ]);
        break;
      case 'testTarget':
        resetSignals([this.buildSignal, this.validBuildSignal]);
        this.testTargetSignal.set((value as string).trim());
        break;
      case 'pool':
        this.poolSignal.set((value as string).trim());
        break;
      case 'build':
        this.buildSignal.set((value as string).trim());
        this.validBuildSignal.set((value as string).trim());
        resetSignals([this.notAvailableMsg]);
        break;
    }
  }

  protected toggleMenu() {
    this.isMenuOpen.update(open => !open);
  }

  protected onColumnClicked(col: string) {
    const cur = this.selectedColumns();
    const isIncluded = cur.includes(col);

    if (isIncluded && cur.length === 1) {
      return;
    }

    const nextValue = isIncluded ? cur.filter(c => c !== col) : [...cur, col];

    this.selectedColumns.set(nextValue);
  }

  protected onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const isBottom =
      element.scrollHeight - element.scrollTop <=
      element.clientHeight + this.SCROLL_BOTTOM_DIFF;

    if (
      isBottom &&
      !this.isEndOfList() &&
      !this.isViewTestEffotLoading().show
    ) {
      this.__listTestEfforts(this.PAGE_SIZE, this.pageToken());
    }
  }

  // For retry button next phase
  protected onRetryActionClicked(p: {
    board: string;
    model: string;
    branch: string;
    target: string;
    build: string;
    testplan: string;
    pools: {label: string; type: number}[];
  }) {
    const confirmed = window.confirm(
      'Are you sure you want to retry test effort?'
    );
    if (confirmed) {
      this.__createTestEffort(p);
    }
  }

  protected onCancelActionClicked(recordId: string) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel test effort ${recordId}?`
    );
    if (confirmed) {
      this.__cancelTestEffort(recordId);
    }
  }

  protected onSwitchScheduleRunClicked() {
    if (this.isScheduleRun()) {
      // We're already on the schedule page, go back
      this.router.navigate(['/run_tests/android/autoqual']);
      return;
    }

    this.router.navigate(['/run_tests/android/autoqual/schedule']);
  }

  protected onCrossBranchTestingChanged(value: boolean) {
    resetSignals([
      this.buildSignal,
      this.validBuildSignal,
      this.buildOptions,
      this.testBranchSignal,
      this.testTargetSignal,
      this.testValidBuildSignal,
    ]);
    this.isCrossBranchSignal.set(value);
  }

  protected onAdvancedSettingsChanged(settings: ICustomSettings) {
    this.customSettings = settings;
    this.skipBootPrerequisiteSignal.set(!!settings.skipBootPrerequisite);
  }

  protected onTestBranchTargetBuildChanged(value: ALBuildBasic) {
    this.testBranchSignal.set(value.branch);
    this.testTargetSignal.set(value.target);
    this.testValidBuildSignal.set(value.build);
  }

  protected onLoadingChanged(loadingWithMsg: {show: boolean; message: string}) {
    this.isScheduleRunLoading.set(loadingWithMsg);
  }

  protected onScheduleClicked() {
    const testplan = this.testplanSignal();
    const isCrossBranch = this.isCrossBranchSignal();

    this.__createTestEffort({
      board: this.boardSignal(),
      model: this.modelSignal(),
      branch: this.branchSignal(),
      target: this.boardTargetSignal(),
      build: this.validBuildSignal(),
      testplan: testplan,
      pools: [{label: this.poolSignal(), type: 1}],
      testBranch: isCrossBranch ? this.testBranchSignal() : this.branchSignal(),
      testTarget: this.testTargetSignal(),
      testBuild: isCrossBranch
        ? this.testValidBuildSignal()
        : this.validBuildSignal(),
      skipBootPrerequisite: this.skipBootPrerequisiteSignal(),
    });
  }

  protected onTestplanValueChanged(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.testplanSignal.set(value);
  }

  protected onReloadTestRecordsClicked() {
    this.pageToken.set('');
    this.isEndOfList.set(false);
    this.testRecords.set([]);
    this.__listTestEfforts(this.PAGE_SIZE, this.pageToken());
  }

  private __listTestEfforts(pageSize: number, pageToken: string) {
    wrapperLoading(
      from(this.androidService.listTestEfforts(pageSize, pageToken)),
      this.isViewTestEffotLoading,
      'Loading test efforts...'
    ).subscribe({
      next: e => {
        const token = e.getNextPageToken();
        this.pageToken.set(token);
        this.isEndOfList.set(token === '' ? true : false);
        this.testRecords.set([
          ...this.testRecords(),
          ...e.getEffortsList().map(eff => {
            const effortId = eff.getId();
            const board = eff.getBoard();
            const model = eff.getModel();
            const build = eff.getAndroid()?.getBuildId() || '';
            const pools = eff.getPoolsList();
            const testplan = eff.getTestplan();
            const date = eff.getCreatedAt()?.toDate() || null;
            const status = this.STATE_MAPPING[eff.getState()] || Status.UNKNOWN;
            const resultLink = eff.getTesthausUrl();

            return {
              id: {str: effortId},
              target: {
                str: board && model ? `${board}/${model}` : '',
              },
              buildID: {str: build},
              pool: {
                str: pools.map(p => p.getLabel()).join(','),
              },
              testplan: {str: testplan},
              createdAt: {date: date},
              status: {status: status},
              resultsLink: {link: resultLink},
              actions: [
                {
                  btn: 'Cancel',
                  fn: () => {
                    this.onCancelActionClicked(effortId);
                  },
                  isDisabled: this.notCancelableStatus.includes(status),
                },
              ],
            };
          }),
        ]);
      },
      error: err => {
        this.notification.error(`List Test Efforts failed: ${err}`, {
          dismiss: false,
        });
      },
    });
  }

  private __createTestEffort(p: {
    board: string;
    model: string;
    branch: string;
    target: string;
    build: string;
    testplan: string;
    pools: {
      label: string;
      type: number;
    }[];
    satlabID?: string;
    product?: string;
    testBranch?: string;
    testTarget?: string;
    testBuild?: string;
    skipBootPrerequisite?: boolean;
  }) {
    wrapperLoading(
      from(
        this.androidService.createTestEffort({
          board: p.board,
          model: p.model,
          branch: p.branch,
          target: p.target,
          build: p.build,
          testplan: p.testplan,
          pools: p.pools,
          satlabID: p.satlabID,
          product: p.product,
          testBranch: p.testBranch,
          testTarget: p.testTarget,
          testBuild: p.testBuild,
          skipBootPrerequisite: p.skipBootPrerequisite,
        })
      ),
      this.isScheduleRunLoading,
      'Creating test effort...'
    ).subscribe({
      next: e => {
        const id = e.getId();
        this.notification.info(`Test effort ${id} created successfully.`, {
          dismiss: true,
        });
        this.router.navigate(['/run_tests/android/autoqual']);
      },
      error: err => {
        this.notification.error(`Create Test Effort failed: ${err}`, {
          dismiss: false,
        });
      },
    });
  }

  private __cancelTestEffort(testEffortID: string) {
    wrapperLoading(
      from(this.androidService.cancelTestEffort(testEffortID)),
      this.isViewTestEffotLoading,
      'Cancelling test effort...'
    ).subscribe({
      next: () => {
        this.notification.info(
          `Test effort ${testEffortID} cancelled successfully. Please refresh the page.`,
          {dismiss: true}
        );
      },
      error: err => {
        this.notification.error(`Cancel Test Effort failed: ${err}`, {
          dismiss: false,
        });
      },
    });
  }

  private __listDuts() {
    wrapperLoading(
      from(this.rpcService.listEnrolledDUTs()),
      this.isScheduleRunLoading,
      'Loading DUTs...'
    ).subscribe({
      next: duts => {
        this.dutsSignal.set(duts);
      },
      error: err => {
        this.notification.error(`List DUTs failed: ${err}`, {
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

  protected onBuildInputChanged(value: string) {
    this.buildSignal.set((value as string).trim());
    resetSignals([this.validBuildSignal, this.notAvailableMsg]);
    const board = this.boardSignal();
    const branch = this.branchSignal();
    const targets = this.isCrossBranchSignal()
      ? [this.boardTargetSignal()]
      : [this.boardTargetSignal(), this.testTargetSignal()];
    const build = this.buildSignal();
    if (board !== '' && branch !== '' && targets.length > 0 && build !== '') {
      this.__isBuildValid(board, branch, targets, build);
    }
  }

  private __isBuildValid(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    wrapperLoading(
      this.androidService.validateBuild(board, branch, targets, build),
      this.isScheduleRunLoading,
      'Validating build...'
    ).subscribe({
      next: isValid => {
        if (isValid) {
          this.validBuildSignal.set(build);
          this.notAvailableMsg.set('');
        } else {
          this.validBuildSignal.set('');
          this.notAvailableMsg.set('This build is not valid.');
        }
      },
      error: e => {
        this.notification.error(`Validate build failed: ${e}`, {
          dismiss: false,
        });
      },
    });
  }

  private __listBranches(boardModel: string[]) {
    wrapperLoading(
      this.androidService.listBranches(boardModel),
      this.isScheduleRunLoading,
      'Listing OS branches...'
    ).subscribe({
      next: branches => {
        this.notAvailableMsg.set(
          branches.length === 0
            ? 'No branches available for the selected board/model.'
            : ''
        );
        this.branchOptions.set(branches.map(toSelectedItem));
      },
      error: err => {
        this.notification.error(`List branches failed: ${err}`, {
          dismiss: false,
        });
      },
    });
  }

  private __listTargets(branch: string) {
    wrapperLoading(
      this.androidService.listTargets(branch),
      this.isScheduleRunLoading,
      'Listing OS targets...'
    ).subscribe({
      next: targets => {
        this.notAvailableMsg.set(
          targets.length === 0
            ? 'No targets available for the selected branch.'
            : ''
        );
        this.targetOptions.set(targets.map(toSelectedItem));
      },
      error: err => {
        this.notification.error(`List targets failed: ${err}`, {
          dismiss: false,
        });
      },
    });
  }

  private __listBuilds(board: string, branch: string, targets: string[]) {
    wrapperLoading(
      this.androidService.listBuilds(board, branch, targets),
      this.isScheduleRunLoading,
      'Listing OS builds...'
    ).subscribe({
      next: builds => {
        this.notAvailableMsg.set(
          builds.length === 0
            ? 'No builds available for the selected target.'
            : ''
        );
        this.buildOptions.set(builds.map(toSelectedItem));
      },
      error: err => {
        this.notification.error(`List builds failed: ${err}`, {dismiss: false});
      },
    });
  }
}

interface AutoQualTestRecord {
  id: StringCell;
  target: StringCell;
  buildID: StringCell;
  pool: StringCell;
  testplan: StringCell;
  createdAt: DateCell;
  status: StatusCell;
  resultsLink: LinkCell;
  actions: ButtonCell[];
}

export type StringCell = {
  str: string;
};

export type StatusCell = {
  status: Status;
};

export type DateCell = {
  date: Date;
};

export type LinkCell = {
  link: string;
};

export type ButtonCell = {
  btn: string;
  fn: () => void;
  isDisabled?: boolean;
};
