import {SelectableItem} from '../../../models/selectable_item';
import {toIterator} from '../../../utils/iterator';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Subscription, debounceTime, distinctUntilChanged} from 'rxjs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ClickDetectorDirective} from '../../../click-detector.directive';
import {MatSelectModule} from '@angular/material/select';
import {NgForOf, NgIf} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-autocomplete-selector',
  templateUrl: './autocomplete-selector.component.html',
  styleUrls: ['./autocomplete-selector.component.scss'],
  standalone: true,
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
  protected searchFormControl = new FormControl('');
  private disposer?: Subscription;

  protected isOpened = signal(false);

  ngOnInit() {
    if (this.disabled) {
      this.searchFormControl.disable();
    }
    this.disposer = this.searchFormControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(v => {
        this.inputChanged.emit(v);
        if (!v) {
          this.filteredOptions = this.options;
          return;
        }

        this.filteredOptions = toIterator(this.options)
          .filter(item => {
            return item.text.includes(v);
          })
          .collect();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      'options' in changes &&
      changes['options'] &&
      changes['options'].currentValue
    ) {
      this.options = changes['options'].currentValue;
      this.filteredOptions = changes['options'].currentValue;
      this.searchFormControl.reset();
    }
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  public clear() {
    this.searchFormControl.reset();
  }

  protected onInputClicked() {
    this.isOpened.update(cur => !cur);
  }

  protected onInputChanged() {
    this.inputValueChanged.emit(this.searchFormControl.value);
  }

  protected onOptionClicked(option?: SelectableItem) {
    this.__closeDropdownIfOpened();
    if (!option) {
      return;
    }

    const newValue =
      typeof option.value === 'string' ? option.value : option.text;
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
