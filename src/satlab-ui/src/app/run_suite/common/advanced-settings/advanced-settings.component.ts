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

  /**
   * onCftChanged handles the cft flag changed event.
   */
  protected onCftChanged(newValue: boolean) {
    let advSettings = {
      ...this._settings.value,
      cft: newValue,
    };
    if (this.customSettings.hasOwnProperty('trv2')) {
      // if `cft` is disable, also disable `trv2` and `uploadToCpcon` flag
      advSettings['trv2'] =
        newValue === false ? false : this._settings.value.trv2;
    }
    if (this.customSettings.hasOwnProperty('uploadToCpcon')) {
      advSettings['uploadToCpcon'] =
        newValue === false ? false : this._settings.value.uploadToCpcon;
    }
    this._settings.next(advSettings);
  }

  /**
   * onTrv2Changed handles the trv2 flag changed event.
   */
  protected onTrv2Changed(newValue: boolean) {
    let advSettings = {
      ...this._settings.value,
      cft: newValue ? true : this._settings.value.cft,
      trv2: newValue,
    };
    if (this.customSettings.hasOwnProperty('uploadToCpcon')) {
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
   * Check the key relation holds. Ex: If trv2 flag exist, cft flag must exist.
   */
  private ensureKeyExistance(settings: ICustomSettings): ICustomSettings {
    if (settings.hasOwnProperty('uploadToCpcon')) {
      settings['trv2'] = false;
      settings['cft'] = true;
    }

    if (settings.hasOwnProperty('trv2')) {
      settings['cft'] = true;
    }

    return settings;
  }
}
