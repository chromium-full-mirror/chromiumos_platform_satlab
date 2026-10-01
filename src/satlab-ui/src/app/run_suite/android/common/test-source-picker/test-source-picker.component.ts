import {
  Component,
  computed,
  effect,
  EffectRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
  ChangeDetectionStrategy,
  untracked,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IDut} from 'app/models/dut';
import {toObservable} from '@angular/core/rxjs-interop';
import {AndroidBuildPickerComponent} from '../android-build-picker/android-build-picker.component';
import {ALBuildBasic} from 'app/models/run_suite_fields';
import {AutocompleteComponent} from 'app/run_suite/common/autocomplete/autocomplete.component';
import {BasicSelectorComponent} from 'app/run_suite/common/basic-selector/basic-selector.component';
import {SelectableItem} from 'app/models/selectable_item';
import {
  AndroidService,
  isDriveType,
  XTS_TYPES,
  XtsAndroidBuildPin,
  XtsMultiArchPin,
  XtsPins,
  XtsPinVariant,
  XtsType,
  XtsZipPin,
} from 'app/services/android.service';
import {resetSignals, wrapperLoading} from 'app/utils/operators';
import {NotificationService} from 'app/services/notification.service';
import {toIterator} from 'app/utils/iterator';
import {noFilesFromDriveMsg} from 'app/models/error';
import {catchError, of} from 'rxjs';

export type SourceValues =
  | {
      mode: 'ANDROID_BUILD';
      buildValues: ALBuildBasic;
      // Set only for a pinned build, where the xTS type is already decided and
      // so must not be asked for a second time further down the form.
      suite?: string | null;
    }
  | {
      mode: 'GOOGLE_DRIVE';
      suite?: string | null;
      zipFileId?: string;
    };

const EMPTY_BUILD: ALBuildBasic = {branch: '', target: '', build: ''};

@Component({
  selector: 'app-test-source-picker',
  imports: [
    CommonModule,
    AndroidBuildPickerComponent,
    AutocompleteComponent,
    BasicSelectorComponent,
  ],
  templateUrl: './test-source-picker.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./test-source-picker.component.scss'],
})
export class TestSourcePickerComponent implements OnDestroy {
  @Input() duts: IDut[] = [];
  @Input() board = '';
  @Input() model = '';
  @Input() set parentLoading(val: boolean) {
    this.parentLoadingSignal.set(val);
  }
  @Input() set isTestplan(val: boolean) {
    this._isTestplan.set(val);
    if (val) {
      this.modeSignal.set('ANDROID_BUILD');
    }
    this.emitValues();
  }
  @Input() set showDriveOption(val: boolean) {
    this._showDriveOption.set(val);
    if (!val) {
      this.modeSignal.set('ANDROID_BUILD');
    }
  }
  /** The OS branch being provisioned. Half of the pinned build key. */
  @Input() set osBranch(val: string) {
    this.osBranchSignal.set(val);
  }
  /** The target being provisioned, whose device is the other half. */
  @Input() set osTarget(val: string) {
    this.osTargetSignal.set(val);
  }

  @Output() sourceValuesChanged = new EventEmitter<SourceValues>();
  @Output() isLoadingChanged = new EventEmitter<{
    show: boolean;
    message: string;
  }>();
  @Output() errorsChanged = new EventEmitter<string>();

  protected _isTestplan = signal<boolean>(false);
  protected _showDriveOption = signal<boolean>(true);
  protected modeSignal = signal<'ANDROID_BUILD' | 'GOOGLE_DRIVE'>(
    'ANDROID_BUILD'
  );

  protected buildValuesSignal = signal<ALBuildBasic>({...EMPTY_BUILD});

  protected driveSelectedSuiteSignal = signal<'gts' | 'sts' | null>(null);
  protected driveSuiteOptions: SelectableItem[] = [
    {label: '', value: 'sts', text: 'sts'},
    {label: '', value: 'gts', text: 'gts'},
  ];
  protected driveXtsPathSignal = signal<string>('');
  protected driveXtsPathOptionsSignal = signal<SelectableItem[]>([]);
  protected driveXtsPathOptions = computed(() => {
    return toIterator(this.driveXtsPathOptionsSignal()).collect();
  });

  // Pinned test builds for the device and OS branch being provisioned.
  protected osBranchSignal = signal<string>('');
  protected osTargetSignal = signal<string>('');
  // Derived from the target by the server, so it is reported rather than
  // recomputed here.
  protected pinnedDeviceSignal = signal<string>('');
  protected pinsSignal = signal<XtsPins>({});
  protected pinnedTypeSignal = signal<XtsType | null>(null);
  protected pinnedTargetSignal = signal<string>('');
  // Only used by a release shipped per architecture, which pins one build per
  // arch rather than a single one.
  protected pinnedArchSignal = signal<string>('');
  // Sticky for the session: once the user opts out they stay opted out, even
  // if they go on to provision a different OS build.
  protected overrideSignal = signal<boolean>(false);

  // Variables for saving loading states.
  protected androidBuildLoadingWithMsg = signal<{
    show: boolean;
    message: string;
  }>({show: false, message: ''});
  protected androidBuildloading$ = toObservable(
    this.androidBuildLoadingWithMsg
  );
  protected driveLoadingWithMsg = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected driveLoading$ = toObservable(this.driveLoadingWithMsg);
  protected pinsLoadingWithMsg = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected parentLoadingSignal = signal<boolean>(false);

  protected isFormLoading = computed(() => {
    if (this.pinsLoadingWithMsg().show) return this.pinsLoadingWithMsg();
    if (this.androidBuildLoadingWithMsg().show)
      return this.androidBuildLoadingWithMsg();
    if (this.driveLoadingWithMsg().show) return this.driveLoadingWithMsg();
    return {show: false, message: ''};
  });

  // Variables for saving error states.
  protected testPickerErrors = signal<string>('');
  private _driveError = signal<string>('');

  protected combinedErrors = computed(() => {
    if (this.showPinned()) {
      // The pinned form takes every value from config, with one exception: for
      // a release shipped per architecture the architecture is the one choice
      // config cannot make, so say so rather than just disabling the run.
      if (this.selectedMultiArchPin() && this.pinnedArchSignal() === '') {
        return 'Select an architecture for this test build.';
      }
      return '';
    }
    const isAndroid = this.isAndroidBuild();
    if (isAndroid) {
      return this.testPickerErrors();
    }
    return this._driveError();
  });

  /**
   * The pinned types the current tab can actually use. A release served from
   * Drive cannot back a testplan run, or a run where the Drive source is
   * switched off.
   */
  protected availableTypes = computed<XtsType[]>(() => {
    const pins = this.pinsSignal();
    const driveUsable = !this._isTestplan() && this._showDriveOption();
    return XTS_TYPES.filter(
      xtsType =>
        pins[xtsType] !== undefined && (driveUsable || !isDriveType(xtsType))
    );
  });

  /** Whether to show the pinned form instead of the regular one. */
  protected showPinned = computed(
    () => this.availableTypes().length > 0 && !this.overrideSignal()
  );

  /** True once the user opted out of a pin that is still on offer. */
  protected isOverridden = computed(
    () => this.overrideSignal() && this.availableTypes().length > 0
  );

  protected pinnedTypeOptions = computed<SelectableItem[]>(() =>
    this.availableTypes().map(xtsType => ({
      label: '',
      value: xtsType,
      text: xtsType,
    }))
  );

  // The selected type decides which shape its pin has, so each shape is picked
  // out on its own and at most one of the three is ever set. Nothing has to
  // detect a shape, and the template branches on the same three signals.

  protected selectedAndroidBuildPin = computed<XtsAndroidBuildPin | undefined>(
    () => {
      const pins = this.pinsSignal();
      switch (this.pinnedTypeSignal()) {
        case 'cts':
          return pins.cts;
        case 'vts':
          return pins.vts;
        default:
          return undefined;
      }
    }
  );

  protected selectedZipPin = computed<XtsZipPin | undefined>(() =>
    this.pinnedTypeSignal() === 'gts' ? this.pinsSignal().gts : undefined
  );

  protected selectedMultiArchPin = computed<XtsMultiArchPin | undefined>(() =>
    this.pinnedTypeSignal() === 'sts' ? this.pinsSignal().sts : undefined
  );

  protected pinnedTargetOptions = computed<SelectableItem[]>(
    () =>
      this.selectedAndroidBuildPin()?.testTargets.map(target => ({
        label: '',
        value: target,
        text: target,
      })) ?? []
  );

  protected pinnedArchOptions = computed<SelectableItem[]>(
    () =>
      this.selectedMultiArchPin()?.variants.map(variant => ({
        label: '',
        value: variant.arch,
        text: variant.arch,
      })) ?? []
  );

  /** The architecture specific build chosen for a per-architecture release. */
  protected selectedVariant = computed<XtsPinVariant | undefined>(() => {
    const arch = this.pinnedArchSignal();
    return this.selectedMultiArchPin()?.variants.find(v => v.arch === arch);
  });

  private refs: EffectRef[] = [];

  constructor(
    private androidService: AndroidService,
    private notificationService: NotificationService
  ) {
    this.refs = [
      effect(() => {
        const osBranch = this.osBranchSignal();
        const osTarget = this.osTargetSignal();
        // Only what is being provisioned may retrigger the lookup. Without
        // this the signals read while emitting would become dependencies too,
        // and every edit to the form would refetch the pins.
        untracked(() => this.__getXtsPins(osBranch, osTarget));
      }),
      effect(() => {
        const driveSuite = this.driveSelectedSuiteSignal();
        if (driveSuite) {
          this.__listDriveXtsPaths(driveSuite);
        }
      }),
      effect(() => {
        const isLoading = this.isFormLoading();
        queueMicrotask(() => {
          this.isLoadingChanged.emit(isLoading);
        });
      }),
      effect(() => {
        const errors = this.combinedErrors();
        queueMicrotask(() => {
          this.errorsChanged.emit(errors);
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.refs.forEach(ref => ref.destroy());
  }

  protected onModeChanged(val: 'ANDROID_BUILD' | 'GOOGLE_DRIVE') {
    if (val === this.modeSignal()) {
      return;
    }
    this.modeSignal.set(val);
    this.emitValues();
  }

  protected onAndroidBuildValuesChanged(values: ALBuildBasic) {
    this.buildValuesSignal.set(values);
    this.emitValues();
  }

  protected onDriveSuiteSelectedChanged(e: 'gts' | 'sts') {
    resetSignals([this.driveXtsPathSignal]);
    this.driveSelectedSuiteSignal.set(e);
    this.emitValues();
  }

  protected onDriveXtsPathChanged(e: string) {
    this.driveXtsPathSignal.set(e);
    this.emitValues();
  }

  protected onPinnedTypeChanged(xtsType: string) {
    // The options come from availableTypes, so this is always an xTS type.
    this.pinnedTypeSignal.set(xtsType as XtsType);
    // The targets and architectures belong to the previous pin.
    this.pinnedTargetSignal.set('');
    this.pinnedArchSignal.set('');
    this.emitValues();
  }

  protected onPinnedArchChanged(arch: string) {
    this.pinnedArchSignal.set(arch);
    this.emitValues();
  }

  protected onPinnedTargetChanged(target: string) {
    this.pinnedTargetSignal.set(target);
    this.emitValues();
  }

  /** Opts out of the pinned build and falls back to the regular form. */
  protected onOverrideClicked() {
    this.overrideSignal.set(true);
    this.emitValues();
  }

  /** Goes back to the pinned build after an opt-out. */
  protected onUsePinnedClicked() {
    this.overrideSignal.set(false);
    this.emitValues();
  }

  protected onLoadingWithMsg(value: {show: boolean; message: string}) {
    queueMicrotask(() => {
      this.androidBuildLoadingWithMsg.set(value);
    });
  }

  private __getXtsPins(osBranch: string, osTarget: string) {
    // Pins are keyed by the device and the OS branch together, so neither half
    // on its own can be looked up.
    if (!osBranch || !osTarget) {
      this.__setPins('', {});
      return;
    }

    wrapperLoading(
      // Best-effort: falling back to the regular form is better than blocking
      // the run. The failure is still logged, because a silent fallback is
      // indistinguishable from a combination that pins nothing.
      this.androidService.getXtsPins(osBranch, osTarget).pipe(
        catchError(err => {
          console.error(
            'Failed to look up the recommended xTS test builds, ' +
              'falling back to manual selection:',
            err
          );
          return of({device: '', pins: {}});
        })
      ),
      this.pinsLoadingWithMsg,
      'Loading recommended test builds...'
    ).subscribe({
      next: res => {
        this.__setPins(res.device, res.pins);
      },
    });
  }

  private __setPins(device: string, pins: XtsPins) {
    this.pinnedDeviceSignal.set(device);
    this.pinsSignal.set(pins);
    this.overrideSignal.set(false);
    this.pinnedTypeSignal.set(null);
    this.pinnedTargetSignal.set('');
    this.pinnedArchSignal.set('');
    this.emitValues();
  }

  private __listDriveXtsPaths(suite: 'gts' | 'sts') {
    wrapperLoading(
      this.androidService.listDriveXtsPaths(suite),
      this.driveLoadingWithMsg,
      `Loading ${suite} paths...`
    ).subscribe({
      next: res => {
        this._driveError.set(
          res.length === 0 ? `${noFilesFromDriveMsg} in ${suite}` : ''
        );
        this.driveXtsPathOptionsSignal.set(
          res.map(path => ({
            label: '',
            value: path.getId(),
            text: path.getName(),
          }))
        );
      },
      error: err => {
        this.notificationService.error(
          `Failed to list ${suite} files from drive: ${err}`,
          {dismiss: false}
        );
      },
    });
  }

  private emitValues() {
    if (this.showPinned()) {
      this.sourceValuesChanged.emit(this.__pinnedSourceValues());
      return;
    }
    if (this.modeSignal() === 'ANDROID_BUILD') {
      this.sourceValuesChanged.emit({
        mode: 'ANDROID_BUILD',
        buildValues: this.buildValuesSignal(),
      });
    } else {
      this.sourceValuesChanged.emit({
        mode: 'GOOGLE_DRIVE',
        suite: this.driveSelectedSuiteSignal(),
        zipFileId: this.driveXtsPathSignal(),
      });
    }
  }

  private __pinnedSourceValues(): SourceValues {
    const androidBuildPin = this.selectedAndroidBuildPin();
    if (androidBuildPin) {
      return {
        mode: 'ANDROID_BUILD',
        buildValues: {
          branch: androidBuildPin.testBranch,
          target: this.pinnedTargetSignal(),
          build: androidBuildPin.testBuild,
        },
        suite: this.pinnedTypeSignal(),
      };
    }
    const zipPin = this.selectedZipPin();
    if (zipPin) {
      return {mode: 'GOOGLE_DRIVE', suite: 'gts', zipFileId: zipPin.testBuild};
    }
    if (this.selectedMultiArchPin()) {
      // A per-architecture release pins no single build, so the chosen variant
      // supplies it. Until one is chosen the id stays empty, which keeps the
      // run disabled.
      return {
        mode: 'GOOGLE_DRIVE',
        suite: 'sts',
        zipFileId: this.selectedVariant()?.testBuild ?? '',
      };
    }
    // No type picked yet. Emitting empty values keeps the run disabled.
    return {mode: 'ANDROID_BUILD', buildValues: {...EMPTY_BUILD}};
  }

  protected isAndroidBuild = computed(
    () => this.modeSignal() === 'ANDROID_BUILD'
  );
  protected isGoogleDrive = computed(
    () => this.modeSignal() === 'GOOGLE_DRIVE'
  );

  protected isDisabled = computed(() => {
    return this.isFormLoading().show || this.parentLoadingSignal();
  });

  protected isDriveDisabled = computed(() => {
    return this.driveLoadingWithMsg().show || this.parentLoadingSignal();
  });
}
