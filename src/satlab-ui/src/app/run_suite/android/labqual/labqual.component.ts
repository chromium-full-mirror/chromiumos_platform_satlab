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
import {CommonModule} from '@angular/common';
import {
  BehaviorSubject,
  catchError,
  finalize,
  from,
  lastValueFrom,
  of,
  Subscription,
} from 'rxjs';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {
  resetSignals,
  toSelectedItem,
  wrapperLoading,
} from '../../../utils/operators';
import {IDut} from '../../../models/dut';
import {NotificationService} from '../../../services/notification.service';
import {toIterator} from '../../../utils/iterator';
import {SelectableItem} from '../../../models/selectable_item';
import {AndroidService} from '../../../services/android.service';
import {toObservable} from '@angular/core/rxjs-interop';
import {LoadingComponent} from '../../common/loading/loading.component';
import {BasicSelectorComponent} from '../../common/basic-selector/basic-selector.component';
import {AutocompleteSelectorComponent} from '../../common/autocomplete-selector/autocomplete-selector.component';
import {LoadingButtonComponent} from '../../../common/loading-button/loading-button.component';
import {MatDividerModule} from '@angular/material/divider';
import {BuildSelectorComponent} from '../../common/build-selector/build-selector.component';
import {startWithTap} from '../../../utils/rxjs_operator';

@Component({
  selector: 'app-labqual',
  standalone: true,
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
  protected notAvailableMsg = signal<string>('');
  protected isRunLoadingSignal = signal<boolean>(false);
  protected _isRunnable = computed(() => {
    const isHostnameValid = this.hostnameSignal() !== '';
    const infoValid = this.dutInfo() !== null;

    return isHostnameValid && infoValid;
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

  private duts = signal<IDut[]>([]);
  private refs: EffectRef[] = [];
  private disposers: Subscription[] = [];

  constructor(
    private service: SatlabRpcService,
    private androidService: AndroidService,
    private notification: NotificationService
  ) {
    this.refs = [
      effect(
        () => {
          const dutInfo = this.dutInfo();
          if (dutInfo) {
            this.__listBranches([dutInfo.board, dutInfo.model]);
          }
        },
        {
          allowSignalWrites: true,
        }
      ),

      effect(
        () => {
          const branch = this.branchSignal();
          if (branch) {
            this.__listTargets(branch);
          }
        },
        {
          allowSignalWrites: true,
        }
      ),

      effect(
        () => {
          const target = this.targetSignal();
          const board = untracked(() => this.dutInfo()?.board);
          const branch = untracked(() => this.branchSignal());
          if (board && branch && target) {
            this.__listBuilds(board, branch, [target]);
          }
        },
        {
          allowSignalWrites: true,
        }
      ),
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
        ]);
        this.hostnameSignal.set((value as string).trim());
        break;
      case 'branch':
        resetSignals([
          this.targetSignal,
          this.buildSignal,
          this.targetOptions,
          this.buildOptions,
        ]);
        this.branchSignal.set((value as string).trim());
        break;
      case 'target':
        resetSignals([this.buildSignal, this.buildOptions]);
        this.targetSignal.set((value as string).trim());
        break;
      case 'build':
        this.buildSignal.set((value as string).trim());
        break;
    }
  }

  protected async onBuildInputValueChanged(value: string) {
    const board = this.dutInfo()?.board ?? '';
    const branch = this.branchSignal();
    const target = this.targetSignal();
    const build = value.trim();
    const resp = await lastValueFrom(
      this.__isBuildValid(board, branch, [target], build)
    );
    if (resp) {
      this.buildSignal.set(build);
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
        const board = this.dutInfo()?.board;
        const model = this.dutInfo()?.model;
        this.notAvailableMsg.set(e.length === 0 ? 'No targets available' : '');
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
}
