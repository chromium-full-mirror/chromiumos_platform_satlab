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
import {FIRMWARE_ARTIFACT} from 'app/constants';
import {IDut} from 'app/models/dut';
import {
  resetSignals,
  toSelectedItem,
  wrapperLoading,
} from '../../../utils/operators';
import {toIterator} from 'app/utils/iterator';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {
  BehaviorSubject,
  finalize,
  from,
  lastValueFrom,
  Subscription,
  tap,
} from 'rxjs';
import {
  BUILD_STATUS_MAPPINGS,
  SelectableItem,
} from 'app/models/selectable_item';
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
    standalone: false
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
  // remove later, we need to change the component `buildSelector` to
  // support `signal`.
  protected firmwareLoading = new BehaviorSubject<{
    show: boolean;
    message: string;
  }>({show: false, message: ''});
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
      this.jobSignal() !== '' &&
      this.isFirmwareValid()
    );
  });
  protected firmwares = signal<{
    1: {milestone: string; build: string};
    2: {milestone: string; build: string};
  }>({1: {milestone: '', build: ''}, 2: {milestone: '', build: ''}});
  private isFirmwareValid = computed(() => {
    const fw1 = this.firmwares()['1'];
    const fw2 = this.firmwares()['2'];

    const fw1Valid = fw1.build !== '' || !this.stableBuildNotFound();

    if (this.jobSignal() === 'faft_fw_update') {
      return fw1Valid && fw2.build !== '';
    }

    return fw1Valid;
  });
  protected stableMilestone = signal<string>('');
  protected stableBuild = signal<string>('');
  protected stableVersion = computed(() => {
    return {
      milestone: this.stableMilestone(),
      build: this.stableBuild(),
    };
  });
  protected stableBuildNotFound = signal<boolean>(false);
  private isFetchingStableVersion = signal<boolean>(false);
  protected isFirmwareSelectable = computed(() => {
    const isFetchedStableBuild =
      (this.stableBuild() !== '' && this.stableMilestone() !== '') ||
      this.stableBuildNotFound();
    const loading = this.isFetchingStableVersion() || this.isRunningSignal();
    return !isFetchedStableBuild || loading;
  });

  private refs: EffectRef[] = [];
  private disposers: Subscription[] = [];

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
            this.__getStableBuild(board, model);
          }
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
        }
      ),
    ];

    this.disposers = [
      this.firmwareLoading.subscribe(e => {
        this.isLoading.set(e);
      }),
    ];
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
    this.disposers.forEach(e => e.unsubscribe());
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

    this.firmwares.update(f => ({...f, 2: {milestone: '', build: ''}}));
  }

  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettingsSignal.set(newValue);
  }

  protected onFirmwareChanged(
    key: 1 | 2,
    e: {milestone: string; build: string}
  ) {
    this.firmwares.update(f => ({...f, [key]: e}));
  }

  protected async onRunClicked() {
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

    const firmwares = await this.stageFirmware();
    if (!firmwares) return;
    const containerInfo = this.createContainerInfo(firmwares);
    const filter =
      containerInfo === null ? [] : [JSON.stringify(containerInfo)];

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
      userDefinedFilter: filter,
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

  private async stageFirmware() {
    this.isLoading.set({show: true, message: 'staging firmware'});
    this.isRunningSignal.set(true);
    const futures: Promise<{key: string; path: string; bucket: string}>[] = [];

    // Use the stable build if the user didn't specify a build.
    const firmwares = this.firmwares();
    if (firmwares['1'].build === '') {
      firmwares['1'].build = this.stableBuild();
    }

    for (const key of Object.keys(firmwares)) {
      if (this.firmwares()[key].build) {
        futures.push(
          lastValueFrom(
            this.satlab_rpcservice.stageBuild(
              {
                board: this.boardSignal(),
                model: this.modelSignal(),
                build: this.firmwares()[key].build,
                artifact: FIRMWARE_ARTIFACT,
              },
              'firmware'
            )
          ).then(resp => {
            return {
              key: key,
              ...resp,
            };
          })
        );
      }
    }

    if (futures.length === 0) {
      this.isRunningSignal.set(false);
      this.isLoading.set({show: false, message: ''});
      return null;
    }

    try {
      const resp = await Promise.all(futures);
      const result: Record<string, {path: string; bucket: string}> = {};
      for (const firmware of resp) {
        result[firmware.key] = {
          path: firmware.path,
          bucket: firmware.bucket,
        };
      }
      return result;
    } catch (e: unknown) {
      this.notification.error(`Stage firmware failed: ${e}`, {dismiss: false});
      this.isRunningSignal.set(false);
      return null;
    } finally {
      this.isLoading.set({show: false, message: ''});
    }
  }

  private createContainerInfo(
    firmwares: Record<string, {bucket: string; path: string}>
  ) {
    const createPath = (bucket: string, path: string) => {
      const b = bucket.endsWith('/') ? bucket : bucket + '/';
      return path.endsWith('/')
        ? `gs://${b}${path}firmware_from_source.tar.bz2`
        : `gs://${b}${path}/firmware_from_source.tar.bz2`;
    };

    const args = [];
    if (firmwares['1'] && firmwares['1'].bucket && firmwares['1'].path) {
      const p1 = createPath(firmwares['1'].bucket, firmwares['1'].path);
      args.push('-ro', p1, '-rw', p1);
    }

    if (firmwares['2'] && firmwares['2'].bucket && firmwares['2'].path) {
      const p2 = createPath(firmwares['2'].bucket, firmwares['2'].path);
      args.push(
        '-testarg',
        `firmware.apro=${p2}`,
        '-testarg',
        `firmware.aprw=${p2}`
      );
    }

    return args.length === 0
      ? null
      : {
          containerInfo: {
            binaryArgs: args,
            container: {
              name: 'firmware-filter',
              tags: ['prod_firmware-filter'],
              digest: 'sha256:',
              repository: {
                hostname: 'us-docker.pkg.dev',
                project: 'cros-registry/partner-test-services',
              },
            },
          },
        };
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
          .map(b => {
            const status = BUILD_STATUS_MAPPINGS[b.getStatus()];
            const s: SelectableItem = {
              text: b.getValue(),
              value: b.getValue(),
              label: status,
            };
            return s;
          })
          .collect();
        this.buildOpts.set(opts);
      },
    });
  }

  private __getStableBuild(board: string, model: string) {
    this.satlab_rpcservice
      .getStableVersion({board: board, model: model, isDesktop: false})
      .pipe(
        startWithTap(() => {
          this.stableBuildNotFound.set(false);
          this.isFetchingStableVersion.set(true);
        }),

        tap(res => {
          const build = res.fwVersion?.match(/(\d+(?:\.\d+){2,})/);
          const milestone = res.fwImage?.match(/R(\d+)(?=-)/);
          if (milestone) {
            this.stableMilestone.set(milestone[1]);
          }
          if (build) {
            this.stableBuild.set(build[1]);
          } else {
            this.stableBuildNotFound.set(true);
          }
        }),

        finalize(() => {
          this.isFetchingStableVersion.set(false);
        })
      )
      .subscribe({
        error: err => console.error(err),
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
