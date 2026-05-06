import {
  AfterViewInit,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  CustomSetting,
  InputBoxSetting,
  NumberKeys,
  SingleChoiceSetting,
} from '../../../models/run_suite_fields';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
// TODO: replace the old advance settings component with this.
export class SettingsComponent {
  // Input custom settings saves the user configured states.
  @Input() set customSettings(val: CustomSetting[]) {
    this.customSettingsSignal.set(val);
  }
  // Input default settings to revert inactive tabs to their initial state.
  @Input() defaultSettings: CustomSetting[] = [];
  // Emit when custom settings are changed.
  @Output() settingsChanged = new EventEmitter<CustomSetting[]>();

  protected customSettingsSignal = signal<CustomSetting[]>([]);

  // errors computes the error from validator then store the error messages in an errorMap.
  protected errors = computed(() => {
    const errorMap: Record<string, string> = {};
    const settings = this.customSettingsSignal();

    for (const s of settings) {
      if (s.format === 'inputBox') {
        const validator = (s as InputBoxSetting).validator;
        if (validator) {
          const err = validator(s.state.value);
          if (err) {
            errorMap[s.key] = err;
          }
        }
      } else if (s.format === 'singleChoice') {
        const group = s as SingleChoiceSetting;
        const currentOption = group.options[group.index];
        if (currentOption && currentOption.format !== 'none') {
          const validator = (currentOption as InputBoxSetting).validator;
          if (validator) {
            const err = validator(currentOption.state.value);
            if (err) {
              errorMap[`${group.key}-${currentOption.key}`] = err;
            }
          }
        }
      }
    }
    return errorMap;
  });

  // hasErrors is used to check if there are any errors in the settings.
  public hasErrors = computed(() => {
    return Object.keys(this.errors()).length > 0;
  });

  protected onInputBoxSettingsChanged(key: NumberKeys, val: number) {
    const safeValue = Number.isNaN(val) ? null : val;
    const newSettings = this.customSettingsSignal().map(s => {
      if (s.format === 'inputBox' && s.key === key) {
        return {...s, state: {...s.state, value: safeValue}};
      }
      return s;
    }) as CustomSetting[];
    this.settingsChanged.emit(newSettings);
  }

  protected trackByKey(_index: number, item: CustomSetting) {
    return item.key;
  }

  protected onShardingModeChanged(group: SingleChoiceSetting, index: number) {
    const targetGroup = this.customSettingsSignal().find(
      s => s.key === group.key
    ) as SingleChoiceSetting;

    const defaultGroup = this.defaultSettings.find(
      s => s.key === group.key
    ) as SingleChoiceSetting;

    if (!targetGroup) return;

    const newSettings = this.customSettingsSignal().map(s => {
      if (s.key === group.key) {
        return {
          ...s,
          index: index,
          options: (s as SingleChoiceSetting).options.map((opt, i) => {
            if (i === index) {
              return opt;
            }
            if (defaultGroup) {
              return defaultGroup.options[i];
            }
            return {
              ...opt,
              state: {
                ...opt.state,
                value: null,
              },
            };
          }),
        } as SingleChoiceSetting;
      }
      return s;
    }) as CustomSetting[];
    this.settingsChanged.emit(newSettings);
  }

  protected onSingleChoiceSubSettingChanged(
    setting: SingleChoiceSetting,
    newVal: number
  ) {
    const newSettings = this.customSettingsSignal().map(s => {
      if (s.key === setting.key && s.format === 'singleChoice') {
        const groupSetting = s as SingleChoiceSetting;
        const updatedOptions = [...groupSetting.options];
        const currentOption = updatedOptions[groupSetting.index];
        if (currentOption.key === 'default') {
          return s;
        }
        const safeValue = Number.isNaN(newVal) ? null : newVal;

        updatedOptions[groupSetting.index] = {
          ...currentOption,
          state: {
            ...currentOption.state,
            value: safeValue,
          },
        };
        return {...s, options: updatedOptions};
      }
      return s;
    }) as CustomSetting[];
    this.settingsChanged.emit(newSettings);
  }
}
