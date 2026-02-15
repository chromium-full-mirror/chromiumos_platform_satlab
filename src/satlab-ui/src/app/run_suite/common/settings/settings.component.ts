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
export class SettingsComponent implements AfterViewInit {
  // input custom settings (currently active states)
  @Input() customSettings: CustomSetting[] = [];
  // input default settings to revert inactive tabs to their initial state
  @Input() defaultSettings: CustomSetting[] = [];
  // emit when custom settings are changed
  @Output() settingsChanged = new EventEmitter<CustomSetting[]>();
  // TODO: this errors only works for sharding mode so far since there's no
  // clear validation for each one for now.
  protected errors = signal<Map<string, string>>(new Map());

  ngAfterViewInit() {
    this.settingsChanged.emit(this.customSettings);
  }
  // hasErrors is used to check if there are any errors in the settings.
  // Currently only works for sharding mode. Especially for the maxInShards.
  public hasErrors = computed(() => {
    const err = this.errors();
    return err ? err.size > 0 : false;
  });

  protected onInputBoxSettingsChanged(key: NumberKeys, val: number) {
    const safeValue = Number.isNaN(val) ? null : val;
    const newSettings = this.customSettings.map(s => {
      if (s.format === 'inputBox' && s.key === key) {
        const error = (s as any).validator
          ? (s as any).validator(safeValue)
          : '';
        this.errors.update(map => this.getUpdatedErrorMap(map, key, error));

        return {...s, state: {...s.state, value: safeValue}};
      }
      return s;
    }) as CustomSetting[];
    this.settingsChanged.emit(newSettings);
  }

  protected trackByKey(_index: number, item: CustomSetting) {
    return item.key;
  }
  // Remove sharding mode errors when the sharding mode is changed.
  // Also, reset the sub settings to their default values when sharding mode is changed.
  protected onShardingModeChanged(group: SingleChoiceSetting, index: number) {
    this.resetShadringModeErrors();
    const targetGroup = this.customSettings.find(
      s => s.key === group.key
    ) as SingleChoiceSetting;

    const defaultGroup = this.defaultSettings.find(
      s => s.key === group.key
    ) as SingleChoiceSetting;

    if (!targetGroup) return;

    const newSettings = this.customSettings.map(s => {
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
    const newSettings = this.customSettings.map(s => {
      if (s.key === setting.key && s.format === 'singleChoice') {
        const groupSetting = s as SingleChoiceSetting;
        const updatedOptions = [...groupSetting.options];
        const currentOption = updatedOptions[groupSetting.index];
        if (currentOption.key === 'default') {
          return s;
        }
        const safeValue = Number.isNaN(newVal) ? null : newVal;
        let error = '';
        if (
          'validator' in currentOption &&
          typeof currentOption.validator === 'function'
        ) {
          error = (currentOption as any).validator(safeValue) || '';
        }
        // Update error map
        const errorKey = `${setting.key}-${currentOption.key}`;
        this.errors.update(map =>
          this.getUpdatedErrorMap(map, errorKey, error)
        );

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

  private getUpdatedErrorMap<K, V>(
    map: Map<K, V>,
    key: K,
    value: V | null | undefined
  ): Map<K, V> {
    const hasKey = map.has(key);
    const currentValue = map.get(key);

    if (!value && !hasKey) return map;

    if (currentValue === value) return map;

    const newMap = new Map(map);
    if (value) {
      newMap.set(key, value);
    } else {
      newMap.delete(key);
    }
    return newMap;
  }

  public resetShadringModeErrors() {
    this.errors.update(map => {
      const newMap = new Map(map);
      for (const key of newMap.keys()) {
        if (key.startsWith('shardingMode-')) {
          newMap.delete(key);
        }
      }
      return newMap;
    });
  }

  public resetToDefault() {
    this.settingsChanged.emit(this.defaultSettings);
  }
}
