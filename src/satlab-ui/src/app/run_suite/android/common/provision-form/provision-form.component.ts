import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ALBuildBasic,
  ALProvisionOptions,
  DefaultALProvisionFields,
} from '../../../../models/run_suite_fields';
import {IDut} from '../../../../models/dut';
import {toObservable} from '@angular/core/rxjs-interop';
import {AndroidBuildPickerComponent} from '../android-build-picker/android-build-picker.component';
import {LoadingComponent} from 'app/run_suite/common/loading/loading.component';

@Component({
  selector: 'app-provision-form',
  standalone: true,
  imports: [AndroidBuildPickerComponent, CommonModule, LoadingComponent],
  templateUrl: './provision-form.component.html',
  styleUrls: ['./provision-form.component.scss'],
})
export class ProvisionFormComponent {
  // Input parameters.
  @Input() duts: IDut[] = [];
  @Input() board = '';
  @Input() model = '';
  @Input() set parentLoading(val: boolean) {
    this.parentLoadingSignal.set(val);
  }
  // Output variables.
  @Output() isLoadingChanged = new EventEmitter<boolean>();
  @Output() provisionFormDataChange: EventEmitter<ALProvisionOptions> =
    new EventEmitter<ALProvisionOptions>();

  protected modeSignal = signal<'DEFAULT' | 'SKIP'>('DEFAULT');
  protected provisionFormValues = signal<ALProvisionOptions>({
    mode: 'DEFAULT',
    value: {
      branch: '',
      target: '',
      build: '',
    },
  });

  protected provisionError = signal<string>('');

  // Loading states.
  protected parentLoadingSignal = signal<boolean>(false);
  protected loadingWithMsg = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = toObservable(this.loadingWithMsg);

  protected combinedErrorMsg = computed(() => {
    const provisionError = this.provisionError();
    const mode = this.modeSignal();
    if (mode === 'DEFAULT') {
      return provisionError;
    }
    return '';
  });

  constructor() {}

  protected onAndroidBuildValuesChanged(val: ALBuildBasic) {
    this.provisionFormValues.update(prev => {
      if (prev.mode === 'DEFAULT') {
        return {
          mode: 'DEFAULT',
          value: {
            ...prev.value,
            ...val,
          },
        };
      }
      return prev;
    });
    this.provisionFormDataChange.emit(this.provisionFormValues());
  }

  protected onModeChanged(val: 'DEFAULT' | 'SKIP') {
    if (val === this.modeSignal()) {
      return;
    }
    this.modeSignal.set(val);
    const prev = this.provisionFormValues();
    if (val === 'DEFAULT') {
      const v = prev as DefaultALProvisionFields;
      this.provisionFormDataChange.emit({
        mode: val,
        value: v.value,
      });
    } else {
      this.provisionFormDataChange.emit({
        mode: val,
      });
    }
  }

  protected onLoadingWithMsg(val: {show: boolean; message: string}) {
    this.loadingWithMsg.set(val);
    queueMicrotask(() => {
      this.isLoadingChanged.emit(val.show);
    });
  }

  protected skipProvisioning = computed(() => {
    return this.modeSignal() === 'SKIP';
  });

  protected isFormLoading = computed(() => {
    return this.loadingWithMsg().show || this.parentLoadingSignal();
  });
}
