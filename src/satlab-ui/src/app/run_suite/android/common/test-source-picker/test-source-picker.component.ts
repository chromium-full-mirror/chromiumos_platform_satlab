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
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IDut} from 'app/models/dut';
import {toObservable} from '@angular/core/rxjs-interop';
import {AndroidBuildPickerComponent} from '../android-build-picker/android-build-picker.component';
import {ALBuildBasic} from 'app/models/run_suite_fields';
import {AutocompleteComponent} from 'app/run_suite/common/autocomplete/autocomplete.component';
import {BasicSelectorComponent} from 'app/run_suite/common/basic-selector/basic-selector.component';
import {SelectableItem} from 'app/models/selectable_item';
import {AndroidService} from 'app/services/android.service';
import {resetSignals, wrapperLoading} from 'app/utils/operators';
import {NotificationService} from 'app/services/notification.service';
import {toIterator} from 'app/utils/iterator';
import {noFilesFromDriveMsg} from 'app/models/error';

export type SourceValues =
  | {
      mode: 'ANDROID_BUILD';
      buildValues: ALBuildBasic;
    }
  | {
      mode: 'GOOGLE_DRIVE';
      suite?: string | null;
      zipFileId?: string;
    };

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

  protected buildValuesSignal = signal<ALBuildBasic>({
    branch: '',
    target: '',
    build: '',
  });

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
  protected parentLoadingSignal = signal<boolean>(false);

  protected isFormLoading = computed(() => {
    if (this.androidBuildLoadingWithMsg().show)
      return this.androidBuildLoadingWithMsg();
    if (this.driveLoadingWithMsg().show) return this.driveLoadingWithMsg();
    return {show: false, message: ''};
  });

  // Variables for saving error states.
  protected testPickerErrors = signal<string>('');
  private _driveError = signal<string>('');

  protected combinedErrors = computed(() => {
    const isAndroid = this.isAndroidBuild();
    if (isAndroid) {
      return this.testPickerErrors();
    }
    return this._driveError();
  });

  private refs: EffectRef[] = [];

  constructor(
    private androidService: AndroidService,
    private notificationService: NotificationService
  ) {
    this.refs = [
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

  protected onLoadingWithMsg(value: {show: boolean; message: string}) {
    queueMicrotask(() => {
      this.androidBuildLoadingWithMsg.set(value);
    });
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
