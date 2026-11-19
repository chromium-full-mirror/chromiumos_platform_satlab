import {ClickDetectorDirective} from '../../../click-detector.directive';
import {SelectableItem} from '../../../models/selectable_item';
import {toIterator} from '../../../utils/iterator';
import {NgForOf, NgIf} from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  SimpleChanges,
  Output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {
  BehaviorSubject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

const RENDER_BATCH_SIZE = 50;
const SCROLL_LOAD_THRESHOLD_PX = 48;

@Component({
  selector: 'app-autocomplete-selector',
  templateUrl: './autocomplete-selector.component.html',
  styleUrls: ['./autocomplete-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatTooltipModule,
    ClickDetectorDirective,
    MatSelectModule,
    ReactiveFormsModule,
    NgForOf,
    NgIf,
    MatListModule,
    MatInputModule,
  ],
})
export class AutocompleteSelectorComponent
  implements OnChanges, OnInit, OnDestroy
{
  // the flag to control the selector can be selected
  @Input() disabled = false;
  // the reason of why the component is disabled
  @Input() disabledMessage = '';
  // the flag to control if auto select the first element, if the
  // only one element
  @Input() autoSelect = true;
  // the options that user can select
  @Input() options: SelectableItem[] = [];
  // the hint that show to a user
  @Input() placeholder = '';
  // the label that show to a user
  @Input() title = '';
  // the error message that we want to show in the UI
  @Input() errorMessage = '';
  // the event that parent component can listen the input element change.
  @Output() inputChanged = new EventEmitter();
  // the event that parent component can listen the select element change.
  @Output() selectChanged = new EventEmitter();
  // the event that parent component can listen the input element change when user un-focus.
  @Output() inputValueChanged = new EventEmitter();

  protected filteredOptions: SelectableItem[] = [];
  protected renderLimit = signal(RENDER_BATCH_SIZE);
  protected searchFormControl = new FormControl('');
  private disposer: Subscription[] = [];
  private _build$ = new BehaviorSubject('');

  protected isOpened = signal(false);

  protected visibleOptions(): SelectableItem[] {
    return this.filteredOptions.slice(0, this.renderLimit());
  }

  ngOnInit() {
    if (this.disabled) {
      this.searchFormControl.disable();
    }
    this.disposer = [
      this.searchFormControl.valueChanges
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe(v => {
          this.inputChanged.emit(v);
          this.renderLimit.set(RENDER_BATCH_SIZE);
          if (!v) {
            this.filteredOptions = this.options;
            return;
          }

          this.filteredOptions = toIterator(this.options)
            .filter(item => {
              return item.text.includes(v);
            })
            .collect();
        }),
      this._build$
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe(v => {
          this.inputValueChanged.emit(v);
        }),
    ];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      'options' in changes &&
      changes['options'] &&
      changes['options'].currentValue
    ) {
      this.options = changes['options'].currentValue;
      this.filteredOptions = changes['options'].currentValue;
      this.renderLimit.set(RENDER_BATCH_SIZE);
      this.searchFormControl.reset();
    }
  }

  ngOnDestroy() {
    this.disposer.forEach(e => e.unsubscribe());
  }

  public clear() {
    this.searchFormControl.reset();
  }

  protected onInputClicked() {
    if (!this.isOpened()) {
      this.renderLimit.set(RENDER_BATCH_SIZE);
    }
    this.isOpened.update(cur => !cur);
  }

  protected onOptionsScroll(event: Event) {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    if (
      el.scrollTop + el.clientHeight >=
      el.scrollHeight - SCROLL_LOAD_THRESHOLD_PX
    ) {
      const total = this.filteredOptions.length;
      if (this.renderLimit() < total) {
        this.renderLimit.update(limit =>
          Math.min(total, limit + RENDER_BATCH_SIZE)
        );
      }
    }
  }

  protected trackByOption(_index: number, option: SelectableItem): string {
    return `${option.value ?? ''}:${option.text}`;
  }

  protected onInputChanged(e: Event & {currentTarget: HTMLInputElement}) {
    this._build$.next(e.currentTarget.value);
  }

  protected onOptionClicked(option?: SelectableItem) {
    this.__closeDropdownIfOpened();
    if (!option) {
      return;
    }

    const newValue =
      typeof option.value === 'string' ? option.value : option.text;

    this._build$.next(newValue);
    this.searchFormControl.setValue(newValue);
    this.selectChanged.emit(newValue);
  }

  protected onOutsideClicked() {
    this.__closeDropdownIfOpened();
  }

  private __closeDropdownIfOpened() {
    if (this.isOpened()) {
      this.isOpened.set(false);
    }
  }
}
