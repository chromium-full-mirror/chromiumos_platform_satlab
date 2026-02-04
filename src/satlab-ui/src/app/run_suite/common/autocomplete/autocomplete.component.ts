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

  @Input() set value(val: string | null) {
    this.searchFormControl.setValue(val ?? '', {emitEvent: false});
    this.searchQuery.set(val ?? '');
  }

  protected disabledMsgSignal = signal<string>('');
  @Input() set disabledMsg(val: string) {
    this.disabledMsgSignal.set(val);
  }

  protected disabledSignal = computed(() => {
    return this.disabledMsgSignal() !== '';
  });

  protected errorMsgSignal = signal<string>('');
  @Input() set errorMsg(val: string) {
    this.errorMsgSignal.set(val);
  }

  protected optionsSignal = signal<SelectableItem[]>([]);
  @Input() set options(val: SelectableItem[]) {
    this.optionsSignal.set(val || []);
    this.searchFormControl.reset();
  }

  protected isOptsOpened = signal(false);
  protected searchQuery = signal('');

  @Output() valueChanged = new EventEmitter<string>();
  @Output() selectChanged = new EventEmitter<string>();

  protected filteredOptions = computed(() => {
    const text = this.searchQuery().toLowerCase();
    const items = this.optionsSignal();
    if (!text) return items;
    return items.filter(opt => opt.text.toLowerCase().includes(text));
  });

  protected searchFormControl = new FormControl('', {nonNullable: true});

  private refs: EffectRef[] = [];
  private sub: Subscription;

  constructor() {
    this.sub = this.searchFormControl.valueChanges.subscribe(val => {
      this.searchQuery.set(val || '');
    });
    this.refs = [
      effect(
        () => {
          const disabled = this.disabledSignal();
          if (disabled) {
            this.searchFormControl.disable({emitEvent: false});
          } else {
            this.searchFormControl.enable({emitEvent: false});
          }
        },
        {
          allowSignalWrites: true,
        }
      ),
    ];
  }

  protected onBlur() {
    this.valueChanged.emit(
      this.searchFormControl.valid ? this.searchFormControl.value : ''
    );
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
    this.isOptsOpened.set(false);
    if (!option) {
      return;
    }
    if (option.label === 'Failed') return;
    const val = typeof option.value === 'string' ? option.value : option.text;
    this.searchFormControl.setValue(val, {emitEvent: false});
    this.searchQuery.set(val);
    this.selectChanged.emit(val);
  }

  ngOnDestroy(): void {
    this.refs.forEach(e => e.destroy());
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
