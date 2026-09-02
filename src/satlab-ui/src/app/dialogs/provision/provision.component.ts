import {
  OS,
  ProvisionFields,
  defaultProvisionFields,
} from '../../models/run_suite_fields';
import {
  BUILD_STATUS_MAPPINGS,
  BuildStatus,
  SelectableItem,
} from '../../models/selectable_item';
import {NotificationService} from '../../services/notification.service';
import {
  Component,
  EffectRef,
  Inject,
  OnDestroy,
  WritableSignal,
  computed,
  effect,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {AndroidService} from 'app/services/android.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {toIterator} from 'app/utils/iterator';
import {startWithTap} from 'app/utils/rxjs_operator';
import { Observable, finalize, from } from 'rxjs';

@Component({
  selector: 'app-provision',
  templateUrl: './provision.component.html',
  styleUrls: ['./provision.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ProvisionComponent implements OnDestroy {
  protected poolOptions: SelectableItem[] = [];

  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = toObservable(this.isLoading);
  protected fieldSignal = signal<ProvisionFields>(defaultProvisionFields);
  protected os = signal<OS>('chromeos');

  protected boardSignal = signal<string>('');
  protected modelSignal = signal<string[]>([]);
  protected branchSignal = signal<string>('');
  protected targetSignal = signal<string>('');
  protected buildSignal = signal<string>('');
  protected validBuildSignal = signal<string>('');
  protected milestoneSignal = signal<string>('');

  protected branchOptions = signal<SelectableItem[]>([]);
  protected targetOptions = signal<SelectableItem[]>([]);
  protected boardTargetOptions = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    return toIterator(this.targetOptions())
      .filter(
        e =>
          e.text.includes(board) ||
          (model.some(elem => e.text.includes(elem)) &&
            !e.text.includes('test_suites'))
      )
      .collect();
  });
  protected buildOptions = signal<SelectableItem[]>([]);
  protected milestoneOptions = signal<SelectableItem[]>([]);
  protected notAvailableMsg = signal<string>('');
  protected isRunnable = computed(() => {
    return (
      (this.os() === 'chromeos' && this.buildSignal() !== '') ||
      (this.os() === 'android' && this.validBuildSignal() !== '')
    );
  });

  private refs: EffectRef[] = [];
  private targets = computed(() => {
    return this.targetSignal().trim() === '' ? [] : [this.targetSignal()];
  });
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

  constructor(
    @Inject(MAT_DIALOG_DATA) data: {board: string; models: string[]},
    private notification: NotificationService,
    private androidService: AndroidService,
    private service: SatlabRpcService
  ) {
    this.boardSignal.set(data.board);
    this.modelSignal.set(data.models);
    this.refs = [
      effect(() => {
        this.__onBoardChanged(
          this.os(),
          this.boardSignal(),
          this.modelSignal()
        );
      }),
      effect(() => {
        this.__onBranchChanged(this.branchSignal());
      }),
      effect(() => {
        const board = untracked(() => this.boardSignal());
        const branch = untracked(() => this.branchSignal());
        const target = this.targets();
        this.__onTargetChanged(board, branch, target);
      }),
      effect(() => {
        const board = untracked(() => this.boardSignal());
        const branch = untracked(() => this.branchSignal());
        const target = untracked(() => this.targets());
        const build = this.buildSignal();
        this.__onBuildChanged(board, branch, target, build);
      }),
      effect(() => {
        const board = untracked(() => this.boardSignal());
        const models = untracked(() => this.modelSignal());
        const milestone = this.milestoneSignal();
        this.__onMilestoneChanged(board, models[0], milestone);
      }),
    ];
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
  }

  protected onChromeOSClicked() {
    this.onPropsChanged('os', 'chromeos');
  }
  protected onAndroidOSClicked() {
    this.onPropsChanged('os', 'android');
  }

  protected onPropsChanged(key: string, value: string | string[]) {
    switch (key) {
      case 'os':
        this.os.set(value as OS);
        this.fieldSignal.set({
          ...this.fieldSignal(),
          os: value as OS,
        });
        resetSignals([
          this.branchSignal,
          this.branchOptions,
          this.targetSignal,
          this.targetOptions,
          this.milestoneSignal,
          this.milestoneOptions,
          this.buildSignal,
          this.validBuildSignal,
          this.buildOptions,
          this.notAvailableMsg,
        ]);
        break;
      case 'branch':
        this.branchSignal.set(value as string);
        resetSignals([
          this.targetSignal,
          this.targetOptions,
          this.buildSignal,
          this.validBuildSignal,
          this.buildOptions,
          this.notAvailableMsg,
        ]);
        break;
      case 'boardTarget':
        this.targetSignal.set(value as string);
        this.fieldSignal.set({
          ...this.fieldSignal(),
          targetType: this.targetType() ?? '',
        });
        resetSignals([
          this.buildSignal,
          this.validBuildSignal,
          this.buildOptions,
          this.notAvailableMsg,
        ]);
        break;
      case 'milestone':
        this.milestoneSignal.set(value as string);
        this.fieldSignal.set({
          ...this.fieldSignal(),
          milestone: this.milestoneSignal(),
        });
        resetSignals([this.buildSignal, this.buildOptions]);
        break;
      case 'build':
        this.buildSignal.set(value as string);
        this.fieldSignal.set({
          ...this.fieldSignal(),
          build: this.buildSignal(),
        });
        resetSignals([this.validBuildSignal, this.notAvailableMsg]);
        break;
    }
  }

  private __onBoardChanged(os: OS, board: string, models: string[]) {
    if (board) {
      switch (os) {
        case 'chromeos':
          this.__listMilestones(board, models[0]);
          break;
        case 'android':
          this.__listBranches(models.length > 1 ? [board] : [...models, board]);
          break;
      }
    }
  }

  private __onBranchChanged(branch: string) {
    if (branch) {
      this.__listTargets(branch);
    }
  }

  private __onTargetChanged(board: string, branch: string, targets: string[]) {
    if (board && branch && targets.length > 0) {
      this.__listAndroidBuilds(board, branch, targets);
    }
  }

  protected onBuildInputValueChanged(value: string) {
    this.onPropsChanged('build', value);
  }

  private __onBuildChanged(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    if (
      this.os() === 'android' &&
      board !== '' &&
      branch !== '' &&
      targets.length !== 0 &&
      /^\d{8}$/.test(build)
    ) {
      this.__isBuildValid(board, branch, targets, build);
    }
  }

  private __onMilestoneChanged(
    board: string,
    model: string,
    milestone: string
  ) {
    if (board !== '' && model !== '' && milestone) {
      this.__listChromeOSBuild(board, model, milestone);
    }
  }

  private __listBranches(boardModels: string[]) {
    wrapperLoading(
      this.androidService.listBranches(boardModels),
      this.isLoading,
      'Loading branches...'
    ).subscribe({
      next: e => {
        this.notAvailableMsg.set(e.length === 0 ? 'No branches available' : '');
        this.branchOptions.set(e.map(d => toSelectedItem(d)));
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
        this.targetOptions.set(e.map(d => toSelectedItem(d)));
      },
      error: e => {
        this.notification.error(`List targets failed: ${e}`, {dismiss: false});
      },
    });
  }

  private __listAndroidBuilds(
    board: string,
    branch: string,
    targets: string[]
  ) {
    wrapperLoading(
      this.androidService.listBuilds(board, branch, targets),
      this.isLoading,
      'Loading builds...'
    ).subscribe({
      next: e => {
        this.notAvailableMsg.set(e.length === 0 ? 'No builds available' : '');
        this.buildOptions.set(e.map(d => toSelectedItem(d)));
      },
      error: e => {
        this.notification.error(`List builds failed: ${e}`, {dismiss: false});
      },
    });
  }

  private __listMilestones(board: string, model: string) {
    wrapperLoading(
      from(this.service.listMilestones({board: board, model: model})),
      this.isLoading,
      'Loading milestones...'
    ).subscribe({
      next: e => {
        this.milestoneOptions.set(
          e
            .map(d => {
              return d.getValue();
            })
            .map(e => toSelectedItem(e))
        );
      },
      error: e => {
        this.notification.error(`List milestones failed: ${e}`, {
          dismiss: false,
        });
      },
    });
  }

  private __listChromeOSBuild(board: string, model: string, milestone: string) {
    wrapperLoading(
      from(
        this.service.listBuilds({
          board: board,
          model: model,
          milestone: milestone,
        })
      ),
      this.isLoading,
      'Loading builds...'
    ).subscribe({
      next: e => {
        this.buildOptions.set(
          e
            .map(d => {
              return {
                text: d.getValue(),
                value: d.getValue(),
                label: BUILD_STATUS_MAPPINGS[d.getStatus()],
              };
            })
            .map(e => toSelectedItem(e.value, e.label))
        );
      },
      error: e => {
        this.notification.error(`List builds failed: ${e}`, {dismiss: false});
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
        isValid
          ? this.validBuildSignal.set(build)
          : this.notAvailableMsg.set(
              'This build is invalid, please choose another one.'
            );
      },
      error: e => {
        this.notification.error(`Validate build failed: ${e}`, {
          dismiss: false,
        });
      },
    });
  }
}

function toSelectedItem(value: string, label?: BuildStatus): SelectableItem {
  return {
    text: value,
    value: value,
    label: label ?? '',
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
