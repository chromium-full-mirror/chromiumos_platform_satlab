import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  IAdvancedSettings,
  defaultAdvancedSettings,
} from 'app/models/run_suite_fields';
import {BehaviorSubject, Subscription} from 'rxjs';

@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  @Input() disabled = false;

  @Output() settingsChanged = new EventEmitter<IAdvancedSettings>();

  private settings: BehaviorSubject<IAdvancedSettings> = new BehaviorSubject({
    ...defaultAdvancedSettings,
  });
  protected settings$ = this.settings.asObservable();
  private disposer?: Subscription;

  constructor() {}

  ngOnInit() {
    // subscript the `settings` value changed
    // When `settings` changed, we can notify the value has been changed.
    this.disposer = this.settings.subscribe(e => this.settingsChanged.emit(e));
    // Notify the value at the first time
    this.settingsChanged.emit(this.settings.value);
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  /**
   * onCftChanged handles the cft flag changed event.
   */
  protected onCftChanged(newValue: boolean) {
    // if `cft` is disable, also disable `trv2` and `uploadToCpcon` flag
    const trv2 = newValue === false ? false : this.settings.value.trv2;
    const uploadToCpcon =
      newValue === false ? false : this.settings.value.uploadToCpcon;
    this.settings.next({
      ...this.settings.value,
      cft: newValue,
      trv2: trv2,
      uploadToCpcon: uploadToCpcon,
    });
  }

  /**
   * onTrv2Changed handles the trv2 flag changed event.
   */
  protected onTrv2Changed(newValue: boolean) {
    // if `trv2` flag is true, also enable `cft` flag
    const cft = newValue ? true : this.settings.value.cft;
    // if `trv2` flag is false, disables `uploadToCpcon` flag
    const uploadToCpcon =
      newValue === false ? false : this.settings.value.uploadToCpcon;
    this.settings.next({
      ...this.settings.value,
      cft: cft,
      trv2: newValue,
      uploadToCpcon: uploadToCpcon,
    });
  }

  /**
   * onUploadToCpconChanged handles the `uplaod cpcon` flag changed event.
   */
  protected onUploadToCpconChanged(newValue: boolean) {
    // If `uploadToCpcon` is true, enables `trv2` and `cft` flags
    const trv2 = newValue ? true : this.settings.value.trv2;
    const cft = newValue ? true : this.settings.value.cft;
    this.settings.next({
      ...this.settings.value,
      uploadToCpcon: newValue,
      // if uploadToCpcon is true, enables the trv2 flag.
      trv2: trv2,
      cft: cft,
    });
  }
}
