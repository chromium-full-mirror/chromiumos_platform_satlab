import {toIterator} from '../../../../app/utils/iterator';
import {IDut} from '../../../models/dut';
import {SelectableItem} from '../../../models/selectable_item';
import {AndroidService} from '../../../services/android.service';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {startWithTap} from '../../../utils/rxjs_operator';
import {
  AfterViewInit,
  Component,
  EffectRef,
  OnDestroy,
  WritableSignal,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {MAX_IN_SHARD_DEFAULT} from 'app/constants';
import {ICustomSettings} from 'app/models/run_suite_fields';
import {NotificationService} from 'app/services/notification.service';
import {Observable, finalize, from} from 'rxjs';

@Component({
  selector: 'app-android-build-select-form',
  templateUrl: './android-build-select-form.component.html',
  styleUrls: ['./android-build-select-form.component.scss'],
})
export class AndroidBuildSelectFormComponent
  implements AfterViewInit, OnDestroy
{
  protected tabSignal = signal<'suite' | 'test' | 'testPlan'>('suite');

  protected boardSignal = signal<string>('');
  protected modelSignal = signal<string>('');
  protected branchSignal = signal<string>('');
  protected targetSignal = signal<{[key: number]: string}>({1: '', 2: ''});
  protected buildSignal = signal<string>('');
  protected poolSignal = signal<string>('');
  protected suiteSignal = signal<string>('');
  protected testModulesSignal = signal<string[]>([]);
  protected testPlanSignal = signal<string>('');
  private targets = computed(() => Object.values(this.targetSignal()));
  private targetType = computed(() => {
    const userDebug = toIterator(this.targets()).first_where(e =>
      e.endsWith('userdebug')
    );
    const splitTarget = userDebug?.split(`${this.boardSignal()}-`);
    if (splitTarget?.length == 2) {
      return splitTarget[1];
    }

    return null;
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
    return toIterator(this.targetOptions())
      .filter(e => e.text.includes(board) && e.text.endsWith('userdebug'))
      .collect();
  });
  protected suiteTargetOptions = computed(() => {
    return toIterator(this.targetOptions())
      .filter(e => e.text.startsWith('test_suites'))
      .collect();
  });
  protected buildOptions = signal<SelectableItem[]>([]);
  protected suiteOptions = signal<SelectableItem[]>([]);
  protected testOptions = signal<SelectableItem[]>([]);

  protected customSettings = signal({maxInShard: MAX_IN_SHARD_DEFAULT});

  protected duts = signal<IDut[]>([]);
  protected androidDuts = computed(() => {
    return this.duts().filter(e => e.hasAndroidDesktopImage === true);
  });
  protected boardOptions = computed(() => {
    return toIterator(this.androidDuts())
      .unique_by_where((a, b) => a.board === b.board)
      .map(e => toSelectedItem(e.board))
      .collect();
  });
  protected modelsOptions = computed(() => {
    return toIterator(this.androidDuts())
      .filter(e => e.board === this.boardSignal())
      .unique_by_where((a, b) => {
        return a.model === b.model;
      })
      .map(e => toSelectedItem(e.model))
      .collect();
  });
  protected poolsOptions = computed(() => {
    return toIterator(this.androidDuts())
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

  constructor(
    private androidService: AndroidService,
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {
    this.refs = [
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
          const tab = this.tabSignal();

          resetSignals([
            this.suiteSignal,
            this.testModulesSignal,
            this.testPlanSignal,
          ]);
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
      case 'board':
        this.boardSignal.set((value as string).trim());
        resetSignals([
          this.modelSignal,
          this.branchSignal,
          this.buildSignal,
          this.poolSignal,
          this.suiteSignal,
          this.targetSignal,
          this.testModulesSignal,
          this.branchOptions,
          this.targetOptions,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
        ]);
        break;
      case 'model':
        this.modelSignal.set((value as string).trim());
        break;
      case 'branch':
        this.branchSignal.set((value as string).trim());
        resetSignals([
          this.buildSignal,
          this.suiteSignal,
          this.targetSignal,
          this.testModulesSignal,
          this.targetOptions,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
        ]);
        break;
      case 'boardTarget':
        this.targetSignal.set({
          ...this.targetSignal(),
          1: (value as string).trim(),
        });
        resetSignals([
          this.buildSignal,
          this.suiteSignal,
          this.testModulesSignal,
          this.buildOptions,
          this.suiteOptions,
          this.testOptions,
        ]);
        break;
      case 'suiteTarget':
        this.targetSignal.set({
          ...this.targetSignal(),
          2: (value as string).trim(),
        });
        break;
      case 'build':
        this.buildSignal.set((value as string).trim());
        resetSignals([this.suiteSignal, this.testModulesSignal]);
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

  protected onCustomSettingsChanged(value: ICustomSettings) {
    this.customSettings.set({
      maxInShard: value.maxInShard,
    });
  }

  protected onChildLoadingChanged(value: {show: boolean; message: string}) {
    this.isLoading.set(value);
  }

  protected onTabChanged(tab: 'suite' | 'test' | 'testPlan') {
    this.tabSignal.set(tab);
  }

  protected onChildSuiteValidChanged(value: boolean) {
    this.suiteValidSignal.set(value);
  }

  protected _isRunnable = computed(() => {
    const extra =
      this.tabSignal() !== 'test' || this.testModulesSignal().length !== 0;
    const shard = this.customSettings().maxInShard;

    return (
      this.isLoading().show === false &&
      this.boardSignal() &&
      this.branchSignal() &&
      this.targetSignal()[1] !== '' &&
      this.targetSignal()[2] !== '' &&
      this.buildSignal() !== '' &&
      this.poolSignal() !== '' &&
      this.suiteValidSignal() &&
      this.targetType() &&
      !Number.isNaN(shard) &&
      Number.isInteger(shard) &&
      shard >= 0 &&
      shard <= 65536 &&
      extra
    );
  });

  protected onRunClicked() {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const build = this.buildSignal();
    const pool = this.poolSignal();
    const suite =
      this.tabSignal() === 'suite' ? `suite:${this.suiteSignal()}` : '';
    const testModules = this.testModulesSignal();
    const targetType = this.targetType();

    let includes = [];
    let excludes = [];
    if (this.tabSignal() === 'test') {
      includes = [...testModules];
    } else {
      excludes = [...testModules];
    }

    const shard = this.customSettings().maxInShard;

    if (this.tabSignal() !== 'testPlan') {
      wrapperLoading(
        from(
          this.androidService.runSuite({
            buildTarget: board,
            model: model,
            build: build,
            pool: pool,
            suite: suite,
            targetType: targetType,
            testInclude: includes,
            testExclulde: excludes,
            maxInShard: shard,
          })
        ),
        this.isLoading,
        `Running ${this.tabSignal()}...`
      ).subscribe({
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
          this.notification.error(`Trigger job failed: ${e}`, {dismiss: false});
        },
      });
    }
  }

  private __onBoardChanged(board: string) {
    if (board) {
      this.__listBranches(board);
    }
  }

  private __onBranchChanged(branch: string) {
    if (branch) {
      this.__listTargets(branch);
    }
  }

  private __onTargetChanged(board: string, branch: string, targets: string[]) {
    if (board !== '' && branch !== '' && targets) {
      this.__listBuilds(board, branch, targets);
    }
  }

  private __listBranches(board: string) {
    wrapperLoading(
      this.androidService.listBranches(board),
      this.isLoading,
      'Loading branches...'
    ).subscribe({
      next: e => {
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
}

function toSelectedItem(value: string): SelectableItem {
  return {
    label: '',
    value: value,
    text: value,
  };
}

function wrapperLoading<T>(
  o: Observable<T>,
  loading: WritableSignal<{show: boolean; message: string}>,
  msg: string
) {
  return o.pipe(
    startWithTap(() => {
      loading.set({
        show: true,
        message: msg,
      });
    }),
    finalize(() => {
      loading.set({
        show: false,
        message: '',
      });
    })
  );
}

function resetSignals(
  signals: WritableSignal<unknown>[],
  defaultValue?: unknown
) {
  if (signals.length > 0) {
    if (defaultValue === undefined) {
      signals.forEach(e => {
        const value = untracked(() => {
          if (defaultValue) {
            return defaultValue;
          }

          if (typeof e() === 'string') {
            return '';
          } else if (Array.isArray(e())) {
            return [];
          } else if (typeof e() === 'object') {
            return {};
          }

          throw Error(`Unknown type of signal: ${typeof e()}`);
        });
        e.set(value);
      });
    }
  }
}
