import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {ICustomSettings} from 'app/models/run_suite_fields';
import {BehaviorSubject, Subscription} from 'rxjs';

@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  @Input() disabled = false;
  @Input() customSettings: ICustomSettings = {};

  @Output() settingsChanged = new EventEmitter<ICustomSettings>();

  private _settings: BehaviorSubject<ICustomSettings> = new BehaviorSubject({});
  protected settings$ = this._settings.asObservable();
  private disposer?: Subscription;

  constructor() {}

  ngOnInit() {
    // check the key existence.
    this.customSettings = this.ensureKeyExistance(this.customSettings);

    this._settings.next(this.customSettings);
    // subscript the `settings` value changed
    // When `settings` changed, we can notify the value has been changed.
    this.disposer = this._settings.subscribe(e => this.settingsChanged.emit(e));
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  /**
   * onExtraTestFilterChanged handles the extraTestFilter flag changed event.
   */
  protected onExtraTestFilterChanged(newValue: boolean) {
    this._settings.next({
      ...this._settings.value,
      extraTestFilter: newValue,
    });
  }

  protected onEditTopologyChanged(newValue: boolean) {
    this._settings.next({
      ...this._settings.value,
      editTopology: newValue,
    });
  }

  /**
   * onCftChanged handles the cft flag changed event.
   */
  protected onCftChanged(newValue: boolean) {
    const advSettings = {
      ...this._settings.value,
      cft: newValue,
    };
    if (Object.hasOwn(this.customSettings, 'trv2')) {
      // if `cft` is disable, also disable `trv2` and `uploadToCpcon` flag
      advSettings['trv2'] =
        newValue === false ? false : this._settings.value.trv2;
    }
    if (Object.hasOwn(this.customSettings, 'uploadToCpcon')) {
      advSettings['uploadToCpcon'] =
        newValue === false ? false : this._settings.value.uploadToCpcon;
    }
    this._settings.next(advSettings);
  }

  /**
   * onTrv2Changed handles the trv2 flag changed event.
   */
  protected onTrv2Changed(newValue: boolean) {
    const advSettings = {
      ...this._settings.value,
      cft: newValue ? true : this._settings.value.cft,
      trv2: newValue,
    };
    if (Object.hasOwn(this.customSettings, 'uploadToCpcon')) {
      // if `trv2` flag is false, disables `uploadToCpcon` flag
      advSettings['uploadToCpcon'] =
        newValue === false ? false : this._settings.value.uploadToCpcon;
    }
    this._settings.next(advSettings);
  }

  /**
   * onUploadToCpconChanged handles the `uplaod cpcon` flag changed event.
   */
  protected onUploadToCpconChanged(newValue: boolean) {
    this._settings.next({
      ...this._settings.value,
      cft: newValue ? true : this._settings.value.cft,
      trv2: newValue ? true : this._settings.value.trv2,
      uploadToCpcon: newValue,
    });
  }

  /**
   * onServoRequired handles the `servo required` flag changed event.
   * @param newValue
   * @protected
   */
  protected onServoRequiredChanged(newValue: boolean) {
    this._settings.next({
      ...this._settings.value,
      servoRequired: newValue,
    });
  }

  /**
   * Check the key relation holds. Ex: If trv2 flag exist, cft flag must exist.
   */
  private ensureKeyExistance(settings: ICustomSettings): ICustomSettings {
    if (Object.hasOwn(settings, 'uploadToCpcon')) {
      settings['trv2'] = false;
      settings['cft'] = true;
    }

    if (Object.hasOwn(settings, 'trv2')) {
      settings['cft'] = true;
    }

    return settings;
  }

  /**
   * Handle max_in_shard input change event.
   */

  protected onShardInputChanged(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this._settings.next({
      ...this._settings.value,
      maxInShard: parseFloat(value),
    });
  }
}
