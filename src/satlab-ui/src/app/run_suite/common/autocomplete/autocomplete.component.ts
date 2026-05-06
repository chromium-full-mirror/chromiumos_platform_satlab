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
} from '@angular/core';
import {Subscription} from 'rxjs';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {SelectableItem} from '../../../models/selectable_item';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatInputModule} from '@angular/material/input';
import {ClickDetectorDirective} from 'app/click-detector.directive';
import {MatSelectModule} from '@angular/material/select';
import {MatListModule} from '@angular/material/list';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [
    ClickDetectorDirective,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatListModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    NgForOf,
    NgIf,
  ],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
})
// TODO: Replace AutoCompleteSelectorComponent with this component in the future.
export class AutocompleteComponent implements OnDestroy {
  @Input() placeholder = '';
  @Input() title = '';
  @Input() strict = false;

  private lastEmittedValue = '';

  @Input() set value(val: string | null) {
    const newVal = val ?? '';
    this.lastEmittedValue = newVal;
    this.syncDisplayValue(newVal);
  }

  protected disabledInputSignal = signal<boolean>(false);
  @Input() set disabled(val: boolean) {
    this.disabledInputSignal.set(val);
    this.toggleFormDisable(this.disabledSignal());
  }

  protected disabledMsgSignal = signal<string>('');
  @Input() set disabledMsg(val: string) {
    this.disabledMsgSignal.set(val);
    this.toggleFormDisable(this.disabledSignal());
  }

  protected disabledSignal = computed(
    () => this.disabledInputSignal() || this.disabledMsgSignal() !== ''
  );

  @Input() set errorMsg(val: string) {
    this.errorMsgSignal.set(val);
  }
  protected errorMsgSignal = signal<string>('');

  @Input() set options(val: SelectableItem[]) {
    this.optionsSignal.set(val || []);
    this.syncDisplayValue(this.lastEmittedValue);
  }
  protected optionsSignal = signal<SelectableItem[]>([]);

  protected isOptsOpened = signal(false);
  protected searchQuery = signal('');

  @Output() inputChanged = new EventEmitter<string>();
  @Output() selectChanged = new EventEmitter<string>();

  protected filteredOptions = computed(() => {
    const text = this.searchQuery().toLowerCase();
    const items = this.optionsSignal();
    if (!text) return items;
    return items.filter(opt => opt.text.toLowerCase().includes(text));
  });

  protected searchFormControl = new FormControl('', {nonNullable: true});
  private sub: Subscription;

  constructor() {
    this.sub = this.searchFormControl.valueChanges.subscribe(val => {
      this.searchQuery.set(val || '');
    });
  }

  private syncDisplayValue(value: string) {
    const option = this.optionsSignal().find(opt => opt.value === value);
    const displayVal = option ? option.text : value;
    this.searchFormControl.setValue(displayVal, {emitEvent: false});
    this.searchQuery.set(displayVal);
  }

  private toggleFormDisable(disabled: boolean) {
    if (disabled) {
      this.searchFormControl.disable({emitEvent: false});
    } else {
      this.searchFormControl.enable({emitEvent: false});
    }
  }
  protected onBlur() {
    const text = this.searchFormControl.value;
    const option = this.optionsSignal().find(opt => opt.text === text);
    let emitVal = '';
    if (option) {
      emitVal = typeof option.value === 'string' ? option.value : option.text;
    } else if (text === '') {
      emitVal = '';
    } else {
      if (this.strict) {
        this.syncDisplayValue(this.lastEmittedValue);
        return;
      } else {
        emitVal = text;
      }
    }

    if (this.lastEmittedValue !== emitVal) {
      this.lastEmittedValue = emitVal;
      this.inputChanged.emit(emitVal);
    }
  }

  protected toggleDropdown() {
    if (!this.disabledSignal()) {
      this.isOptsOpened.update(v => !v);
    }
  }

  protected unfocusedCleanup() {
    this.isOptsOpened.set(false);
  }

  protected onOptionClicked(option?: SelectableItem) {
    if (!option || option.label === 'Failed') return;
    const emitVal =
      typeof option.value === 'string' ? option.value : option.text;

    this.syncDisplayValue(emitVal);
    this.isOptsOpened.set(false);

    if (this.lastEmittedValue !== emitVal) {
      this.lastEmittedValue = emitVal;
      this.selectChanged.emit(emitVal);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
