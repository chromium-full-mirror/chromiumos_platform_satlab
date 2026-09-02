import {LoadingButtonComponent} from '../../../common/loading-button/loading-button.component';
import {FIRMWARE_ARTIFACT} from '../../../constants';
import {IDut} from '../../../models/dut';
import {SelectableItem} from '../../../models/selectable_item';
import {AndroidService} from '../../../services/android.service';
import {NotificationService} from '../../../services/notification.service';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {toIterator} from '../../../utils/iterator';
import {
  resetSignals,
  toSelectedItem,
  wrapperLoading,
} from '../../../utils/operators';
import {startWithTap} from '../../../utils/rxjs_operator';
import {AutocompleteSelectorComponent} from '../../common/autocomplete-selector/autocomplete-selector.component';
import {BasicSelectorComponent} from '../../common/basic-selector/basic-selector.component';
import {BuildSelectorComponent} from '../../common/build-selector/build-selector.component';
import {LoadingComponent} from '../../common/loading/loading.component';
import {CommonModule} from '@angular/common';
import {
  AfterViewInit,
  Component,
  EffectRef,
  OnDestroy,
  computed,
  effect,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {MatDividerModule} from '@angular/material/divider';
import {BUILD_ACCESS_REQUEST_URL} from 'app/constants';
import {
  BehaviorSubject,
  Subscription,
  catchError,
  finalize,
  from,
  lastValueFrom,
  of,
} from 'rxjs';

@Component({
  selector: 'app-labqual',
  imports: [
    CommonModule,
    LoadingComponent,
    BasicSelectorComponent,
    AutocompleteSelectorComponent,
    LoadingButtonComponent,
    MatDividerModule,
    BuildSelectorComponent,
  ],
  templateUrl: './labqual.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./labqual.component.scss'],
})
export class LabqualComponent implements AfterViewInit, OnDestroy {
  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected firmwareLoading$ = new BehaviorSubject<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: '',
  });
  protected loading$ = toObservable(this.isLoading);
  protected hostnameOptions = computed(() => {
    return toIterator(this.duts())
      .map(e => e.hostname)
      .map(toSelectedItem)
      .collect();
  });
  protected branchOptions = signal<SelectableItem[]>([]);
  protected targetOptions = signal<SelectableItem[]>([]);
  protected buildOptions = signal<SelectableItem[]>([]);
  protected hostnameSignal = signal<string>('');
  protected branchSignal = signal<string>('');
  protected targetSignal = signal<string>('');
  protected buildSignal = signal<string>('');
  protected validBuildSignal = signal<string>('');
  readonly buildAccessRequestLink = BUILD_ACCESS_REQUEST_URL;
  protected isRunLoadingSignal = signal<boolean>(false);
  protected _isRunnable = computed(() => {
    const isHostnameValid = this.hostnameSignal() !== '';
    const infoValid = this.dutInfo() !== null;
    const hasBranch = this.branchOptions().length !== 0;
    const OSformValid = this.__checkAllOrNone([
      !!this.branchSignal(),
      !!this.targetSignal(),
      !!this.buildSignal(),
      !!this.validBuildSignal(),
    ]);
    const firmwareFormValid = this.__checkAllOrNone([
      !!this.firmware().milestone,
      !!this.firmware().build,
    ]);
    const loading = this.isLoading().show || this.isRunLoadingSignal();

    return (
      isHostnameValid &&
      infoValid &&
      hasBranch &&
      OSformValid &&
      firmwareFormValid &&
      !loading
    );
  });
  protected dutInfo = computed(() => {
    const hostname = this.hostnameSignal();
    const dut = toIterator(this.duts()).first_where(
      e => e.hostname === hostname
    );

    if (dut) {
      return {
        board: dut.board,
        model: dut.model,
      };
    }

    return null;
  });
  protected firmware = signal<{milestone: string; build: string}>({
    milestone: '',
    build: '',
  });
  protected noValidBranchError = signal<string>('');
  protected noValidTargetError = signal<string>('');
  protected noValidBuildError = signal<string>('');
  protected noValidFormError = signal<string>('');
  protected branchErrorLink = computed(() => {
    return this.noValidBranchError() === '' ? '' : 'this link.';
  });
  protected displayedError = computed(() => {
    switch (true) {
      case this.noValidBranchError() !== '':
        return this.noValidBranchError();
      case this.noValidTargetError() !== '':
        return this.noValidTargetError();
      case this.noValidBuildError() !== '':
        return this.noValidBuildError();
      case this.noValidFormError() !== '':
        return this.noValidFormError();
      default:
        return '';
    }
  });

  private duts = signal<IDut[]>([]);
  private refs: EffectRef[] = [];
  private disposers: Subscription[] = [];

  constructor(
    private service: SatlabRpcService,
    private androidService: AndroidService,
    private notification: NotificationService
  ) {
    this.refs = [
      effect(() => {
        const dutInfo = this.dutInfo();
        if (dutInfo) {
          this.__listBranches([dutInfo.board, dutInfo.model]);
        }
      }),

      effect(() => {
        const branch = this.branchSignal();
        if (branch) {
          this.__listTargets(branch);
        }
      }),

      effect(() => {
        const target = this.targetSignal();
        const board = untracked(() => this.dutInfo()?.board);
        const branch = untracked(() => this.branchSignal());
        if (board && branch && target) {
          this.__listBuilds(board, branch, [target]);
        }
      }),
      effect(() => {
        const branch = this.branchSignal();
        const target = this.targetSignal();
        const build = this.buildSignal();

        this.noValidFormError.set(
          build && (!branch || !target)
            ? 'Please select branch and target before entering builds.'
            : ''
        );
      }),
    ];

    this.disposers = [
      this.firmwareLoading$.subscribe(e => this.isLoading.set(e)),
    ];
  }

  ngAfterViewInit() {
    this.__listDuts();
  }

  ngOnDestroy() {
    this.refs.forEach(e => e.destroy());
    this.disposers.forEach(e => e.unsubscribe());
  }

  protected onPropsChanged(key: string, value: string) {
    switch (key) {
      case 'hostname':
        resetSignals([
          this.branchSignal,
          this.targetSignal,
          this.buildSignal,
          this.branchOptions,
          this.targetOptions,
          this.buildOptions,
          this.noValidBranchError,
          this.noValidTargetError,
          this.noValidBuildError,
        ]);
        this.hostnameSignal.set((value as string).trim());
        break;
      case 'branch':
        resetSignals([
          this.targetSignal,
          this.targetOptions,
          this.buildSignal,
          this.buildOptions,
          this.noValidBranchError,
          this.noValidTargetError,
          this.noValidBuildError,
        ]);
        this.branchSignal.set((value as string).trim());
        break;
      case 'target':
        resetSignals([
          this.buildSignal,
          this.buildOptions,
          this.noValidTargetError,
          this.noValidBuildError,
        ]);
        this.targetSignal.set((value as string).trim());
        break;
      case 'build':
        resetSignals([this.noValidBuildError]);
        this.buildSignal.set((value as string).trim());
        this.validBuildSignal.set((value as string).trim());
        break;
    }
  }

  protected async onBuildInputValueChanged(value: string) {
    const board = this.dutInfo()?.board ?? '';
    const branch = this.branchSignal();
    const target = this.targetSignal();
    const build = value.trim();
    this.validBuildSignal.set('');
    this.noValidBuildError.set('');
    this.buildSignal.set(build);

    // If the form is not fully filled, don't validate the build.
    if (!board || !branch || !target || !build) {
      return;
    }

    const resp = await lastValueFrom(
      this.__isBuildValid(board, branch, [target], build)
    );
    if (resp) {
      this.validBuildSignal.set(build);
    } else {
      this.validBuildSignal.set('');
      this.noValidBuildError.set('invalid build.');
    }
  }

  protected onFirmwareChanged(newValue: {milestone: string; build: string}) {
    this.firmware.set(newValue);
  }

  protected async onRunClicked() {
    if (!this._isRunnable()) {
      return;
    }

    let firmwarePath = '';

    if (this.firmware().build !== '') {
      try {
        this.isLoading.set({show: true, message: 'Staging the firmware...'});
        this.isRunLoadingSignal.set(true);

        const resp = await lastValueFrom(
          this.service.stageBuild(
            {
              board: this.dutInfo()!.board,
              model: this.dutInfo()!.model,
              build: this.firmware().build,
              artifact: FIRMWARE_ARTIFACT,
            },
            'firmware'
          )
        );

        firmwarePath = resp.path;
      } catch (e) {
        this.notification.error(`Staging firmware failed: ${e}`, {
          dismiss: false,
        });
        this.isRunLoadingSignal.set(false);

        return;
      } finally {
        this.isLoading.set({show: false, message: ''});
      }
    }

    wrapperLoading(
      this.androidService.runLabqual(
        this.hostnameSignal(),
        this.dutInfo()!.board,
        this.dutInfo()!.model,
        this.buildSignal(),
        firmwarePath,
        this.targetSignal()
      ),
      this.isLoading,
      `Running a Labqual...`
    )
      .pipe(
        startWithTap(() => this.isRunLoadingSignal.set(true)),
        finalize(() => this.isRunLoadingSignal.set(false))
      )
      .subscribe({
        next: buildLink => {
          this.notification.info(
            [
              `Triggering a Labqual succeed! Link:`,
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

  private __listBranches(targets: string[]) {
    wrapperLoading(
      this.androidService.listBranches(targets),
      this.isLoading,
      'Loading branches...'
    ).subscribe({
      next: e => {
        this.noValidBranchError.set(
          e.length === 0
            ? 'No branches available - please request the permission by '
            : ''
        );
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
        const board = this.dutInfo()?.board;
        const model = this.dutInfo()?.model;
        this.targetOptions.set(
          toIterator(e)
            .filter(e => {
              return (
                !e.includes('test_suites') &&
                (e.includes(board) || e.includes(model))
              );
            })
            .map(toSelectedItem)
            .collect()
        );
        const optionLength = this.targetOptions().length;
        this.noValidTargetError.set(
          optionLength === 0 ? 'No targets available' : ''
        );
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
        this.noValidBuildError.set(e.length === 0 ? 'No builds available' : '');
        this.buildOptions.set(e.map(toSelectedItem));
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
    return wrapperLoading(
      this.androidService.validateBuild(board, branch, targets, build),
      this.isLoading,
      'Validating build...'
    ).pipe(
      catchError(e => {
        this.notification.error(`Validate build failed: ${e}`, {
          dismiss: false,
        });
        return of(false);
      })
    );
  }

  private __checkAllOrNone(values: boolean[]) {
    return new Set(values).size <= 1;
  }
}
