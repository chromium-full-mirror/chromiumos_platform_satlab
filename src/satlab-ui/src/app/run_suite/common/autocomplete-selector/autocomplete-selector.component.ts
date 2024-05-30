import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {SelectableItem} from '../../../models/selectable_item';
import {FormControl} from '@angular/forms';
import {toIterator} from '../../../utils/iterator';
import {debounceTime, distinctUntilChanged, Subscription} from 'rxjs';

@Component({
  selector: 'app-autocomplete-selector',
  templateUrl: './autocomplete-selector.component.html',
  styleUrls: ['./autocomplete-selector.component.scss'],
})
export class AutocompleteSelectorComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() isShown = false;
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

  protected filteredOptions: SelectableItem[] = [];
  protected searchFormControl = new FormControl('');
  protected isHover = false;
  private disposer?: Subscription;

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

  protected onInputFocusIn() {
    this.isShown = true;
  }

  protected onInputFocusout() {
    if (!this.isHover) {
      this.isShown = false;
    }
  }

  protected onMouseEnter() {
    this.isHover = true;
  }

  protected onMouseLeave() {
    this.isHover = false;
  }

  protected onOptionClicked(option?: SelectableItem) {
    if (!option) {
      return;
    }
    this.isHover = false;
    this.isShown = false;
    const newValue =
      typeof option.value === 'string' ? option.value : option.text;
    this.searchFormControl.setValue(newValue);
    this.selectChanged.emit(newValue);
  }
}
