import {
  AfterViewInit,
  Component,
  computed,
  effect,
  EffectRef,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import {IDut} from 'app/models/dut';
import {
  resetSignals,
  toSelectedItem,
  wrapperLoading,
} from '../../../utils/operators';
import {toIterator} from 'app/utils/iterator';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {finalize, from} from 'rxjs';
import {SelectableItem} from 'app/models/selectable_item';
import {ICustomSettings, IDims} from 'app/models/run_suite_fields';
import {
  RunChromeOSRequest,
  Suite,
  Test,
  Testplan,
  isSuiteTestPlan,
} from 'app/models/run';
import {toObservable} from '@angular/core/rxjs-interop';
import {faftRunConfig, TestConfig} from 'app/models/config';
import {startWithTap} from 'app/utils/rxjs_operator';

@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.scss'],
})
export class RunComponent implements AfterViewInit, OnDestroy {
  // dutsSignal records the qualified duts in this component.
  protected dutsSignal = signal<IDut[]>([]);
  // modelSignal saves the value of model.
  protected modelSignal = signal<string>('');
  // boardSignal saves the value of board.
  protected boardSignal = signal<string>('');
  // milestoneSignal saves the value of milestone.
  protected milestoneSignal = signal<string>('');
  // buildSignal saves the value of build.
  protected buildSignal = signal<string>('');
  // poolSignal saves the value of pool.
  protected poolSignal = signal<string>('');
  // jobSignal saves the name for job.
  protected jobSignal = signal<string>('');
  // dimSignal saves the value of dims.
  protected dimSignal = signal<IDims>({});
  // tagsToXXX saves the tags while triggering a test.
  protected tagsToIncludeSignal = signal<string[]>([]);
  protected tagsToExcludeSignal = signal<string[]>([]);
  protected testNamesIncludeSignal = signal<string[]>([]);
  protected testNameExcludeSignal = signal<string[]>([]);
  // testArgsSignal saves the test args.
  protected testArgsSignal = signal<string>('');
  // customSettingsSignal controls the items in advanced settings.
  protected customSettingsSignal = signal<ICustomSettings>({
    testArgs: false,
    cft: true,
    trv2: false,
    uploadToCpcon: false,
  });
  // isSuiteTestPlanSignal determines if it is suite, test, or testplan.
  protected isSuiteTestPlanSignal = signal<isSuiteTestPlan>('');
  // isRunningSignal saves the button status while triggering a test.
  protected isRunningSignal = signal<boolean>(false);
  // isLoading control the status of fetching APIs.
  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = toObservable(this.isLoading);
  // loading faft default test config.
  readonly faftConfig = faftRunConfig;
  // parsing all the suite/test name based on keys.
  protected faftSuiteTestOpts: SelectableItem[] = toIterator(
    Object.entries(faftRunConfig)
  )
    .map(v => {
      return {
        text: v[0],
        value: {key: v[0], value: v[1]},
        label: '',
      } as SelectableItem;
    })
    .collect();
  // modelOpts saves the options for model.
  protected modelOpts = computed(() => {
    const duts = this.dutsSignal();
    return toIterator(duts)
      .map(d => d.model)
      .unique_by()
      .map(e => toSelectedItem(e))
      .collect();
  });
  // boardOpts saves the options for board.
  protected boardOpts = computed(() => {
    const duts = this.dutsSignal();
    const model = this.modelSignal();
    return toIterator(duts)
      .filter(d => d.model === model)
      .map(d => d.board)
      .unique_by()
      .map(b => toSelectedItem(b))
      .collect();
  });
  // poolOpts saves the options for pool.
  protected poolOpts = computed(() => {
    const duts = this.dutsSignal();
    const model = this.modelSignal();
    const board = this.boardSignal();
    return toIterator(duts)
      .filter(e => e.board === board && e.model === model)
      .map(e => e.pools)
      .flatten()
      .unique_by()
      .map(e => toSelectedItem(e))
      .collect();
  });
  // milestoneOpts saves the options for milestone.
  protected milestoneOpts = signal<SelectableItem[]>([]);
  // buildOpts saves the options for build.
  protected buildOpts = signal<SelectableItem[]>([]);
  // ableToRun determines if it can trigger a job.
  protected ableToRun = computed(() => {
    return (
      this.boardSignal() !== '' &&
      this.modelSignal() !== '' &&
      this.milestoneSignal() !== '' &&
      this.buildSignal() !== '' &&
      this.poolSignal() !== '' &&
      this.isSuiteTestPlanSignal() !== '' &&
      this.jobSignal() !== ''
    );
  });

  private refs: EffectRef[] = [];

  constructor(
    private satlab_rpcservice: SatlabRpcService,
    private notification: NotificationService
  ) {
    this.refs = [
      effect(
        () => {
          const board = this.boardSignal();
          const model = this.modelSignal();

          if (board && model) {
            this.__listMilestone(board, model);
          }
        },
        {
          allowSignalWrites: true,
        }
      ),
      effect(
        () => {
          const board = untracked(() => this.boardSignal());
          const model = untracked(() => this.modelSignal());
          const milestone = this.milestoneSignal();

          if (milestone) {
            this.__listBuild(board, model, milestone);
          }
        },
        {
          allowSignalWrites: true,
        }
      ),
    ];
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
  }

  protected onPropsChanged(key: string, value: string) {
    switch (key) {
      case 'model':
        resetSignals([
          this.boardSignal,
          this.milestoneOpts,
          this.milestoneSignal,
          this.buildOpts,
          this.buildSignal,
          this.poolSignal,
        ]);
        this.modelSignal.set(value.trim());
        break;
      case 'board':
        this.boardSignal.set(value.trim());
        break;
      case 'milestone':
        resetSignals([this.buildOpts, this.buildSignal]);
        this.milestoneSignal.set(value.trim());
        break;
      case 'build':
        this.buildSignal.set(value.trim());
        break;
      case 'pool':
        this.poolSignal.set(value.trim());
        break;
    }
  }

  protected onFaftChanged(select: {key: string} & {value: TestConfig}) {
    this.isSuiteTestPlanSignal.set(select.value.kind);
    this.jobSignal.set(
      select.value.kind === 'test' ? select.value.name : select.key
    );
    this.tagsToIncludeSignal.set(select.value.tagsToInclude ?? []);
    this.tagsToExcludeSignal.set(select.value.tagsToExclude ?? []);
    this.testNamesIncludeSignal.set(select.value.testNamesInclude ?? []);
    this.testNameExcludeSignal.set(select.value.testNamesExclude ?? []);
    this.testArgsSignal.set(
      'testArgs' in select.value ? select.value.testArgs : ''
    );
    // If selected test type is 'test' and it has testArgs, enable testArgs by default.
    this.customSettingsSignal.update(settings => ({
      ...settings,
      testArgs: select.value.kind === 'test' && !!select.value.testArgs,
    }));
  }

  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettingsSignal.set(newValue);
  }

  protected onRunClicked() {
    if (!this.ableToRun()) {
      return;
    }

    const {
      testArgs: isTestArgsOn = false,
      cft = false,
      trv2 = false,
      uploadToCpcon = false,
    } = this.customSettingsSignal();

    const isSuiteTestPlan = this.isSuiteTestPlanSignal();
    const jobName = this.jobSignal();
    const testArgs = isTestArgsOn ? this.testArgsSignal() : '';

    const runTask = buildRunTask(isSuiteTestPlan, jobName, testArgs);

    const req: RunChromeOSRequest = {
      run: runTask,
      os: 'chromeos',
      model: this.modelSignal(),
      board: this.boardSignal(),
      milestone: this.milestoneSignal(),
      build: this.buildSignal(),
      pool: this.poolSignal(),
      dims: this.dimSignal(),
      tags: {
        tagsToInclude: this.tagsToIncludeSignal(),
        tagsToExclude: this.tagsToExcludeSignal(),
        testNamesInclude: this.testNamesIncludeSignal(),
        testNamesExclude: this.testNameExcludeSignal(),
      },
      advanceSettings: {
        cft: cft,
        trv2: trv2,
        uploadToCpcon: uploadToCpcon,
      },
    };

    wrapperLoading(
      from(this.satlab_rpcservice.run(req)),
      this.isLoading,
      'triggering a job'
    )
      .pipe(
        startWithTap(() => this.isRunningSignal.set(true)),
        finalize(() => this.isRunningSignal.set(false))
      )
      .subscribe({
        next: buildLink =>
          this.notification.info(
            [
              'Trigger job successfully! Job link: ',
              {
                type: 'url',
                url: buildLink,
              },
            ],
            {dismiss: false}
          ),
        error: e => {
          this.notification.error(`Trigger job failed: ${e}`, {dismiss: false});
        },
      });
  }

  ngAfterViewInit(): void {
    this.__listDuts();
  }

  private __listDuts() {
    wrapperLoading(
      from(this.satlab_rpcservice.listEnrolledDUTs()),
      this.isLoading,
      'fetching models...'
    ).subscribe({
      next: d => {
        this.dutsSignal.set(d);
      },
      error: e => {
        this.notification.error(`Fetching model got an error: ${e}`, {
          dismiss: false,
        });
      },
    });
  }

  private __listMilestone(board: string, model: string) {
    wrapperLoading(
      from(this.satlab_rpcservice.listMilestones({board: board, model: model})),
      this.isLoading,
      'fetching milestone'
    ).subscribe({
      next: m => {
        const opts = toIterator(m)
          .map(m => m.getValue())
          .map(m => {
            const s: SelectableItem = {
              text: m,
              value: m,
              label: '',
            };
            return s;
          })
          .collect();
        this.milestoneOpts.set(opts);
      },
    });
  }

  private __listBuild(board: string, model: string, milestone: string) {
    wrapperLoading(
      from(
        this.satlab_rpcservice.listBuilds({
          board: board,
          model: model,
          milestone: milestone,
        })
      ),
      this.isLoading,
      'fetching build'
    ).subscribe({
      next: b => {
        const opts = toIterator(b)
          .map(b => b.getValue())
          .map(b => {
            const s: SelectableItem = {
              text: b,
              value: b,
              label: '',
            };
            return s;
          })
          .collect();
        this.buildOpts.set(opts);
      },
    });
  }
}

function buildRunTask(
  kind: isSuiteTestPlan,
  name: string,
  testArgs: string
): Suite | Test | Testplan {
  switch (kind) {
    case 'suite':
      return {kind, name};
    case 'testplan':
      return {kind, name};
    case 'test':
      return {
        kind,
        name,
        args: testArgs,
      };
    default:
      throw new Error('Invalid job kind');
  }
}
