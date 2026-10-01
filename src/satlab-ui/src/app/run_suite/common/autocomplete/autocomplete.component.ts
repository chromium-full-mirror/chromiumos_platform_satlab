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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./autocomplete.component.scss'],
})
// TODO: Replace AutoCompleteSelectorComponent with this component in the future.
export class AutocompleteComponent implements OnDestroy {
  @Input() placeholder = '';
  @Input() title = '';
  @Input() strict = false;
  // Show `value` in the same field as always, but fixed: no typing, no
  // dropdown. For a value decided outside the form, so that it still looks
  // like the fields around it.
  @Input() readOnly = false;
  // Pick the only option when there is exactly one and nothing is chosen yet,
  // so a field with no real choice need not be opened. Same contract as
  // app-basic-selector's input of the same name, but off by default: the
  // fields that already use this component were written without it.
  @Input() autoSelect = false;

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
    this.autoSelectSingleOption();
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

  // Deferred, because `value` may still be set later in the same change
  // detection pass -- inputs are assigned in template order -- and a value
  // already chosen must win over the guess.
  private autoSelectSingleOption() {
    if (!this.autoSelect || this.readOnly) return;
    queueMicrotask(() => {
      const options = this.optionsSignal();
      if (this.lastEmittedValue || options.length !== 1) return;
      this.onOptionClicked(options[0]);
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
    if (this.readOnly) return;
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
