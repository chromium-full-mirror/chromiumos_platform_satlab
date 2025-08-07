import {SelectableItem} from '../../../models/selectable_item';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-basic-selector',
  templateUrl: './basic-selector.component.html',
  styleUrls: ['./basic-selector.component.scss'],
})
export class BasicSelectorComponent implements OnInit, OnChanges {
  @ViewChild('selector') selector!: MatSelect;

  @Input() isShown = true;
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
  // the event that parent component can listen the selected element change.
  @Output() select = new EventEmitter();

  selected: unknown = '';

  ngOnInit(): void {
    this.autoSelectedSingleOption();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('options' in changes && changes['options']) {
      this.selected = '';
      this.options = changes['options'].currentValue;
      this.autoSelectedSingleOption();
    }
  }

  // select the option if there is only one option
  public autoSelectedSingleOption() {
    if (this.autoSelect && this.options.length === 1) {
      this.selectOption(0);
    }
  }

  // clear the selection
  public clearSelection(): void {
    this.selected = '';
  }

  // the function that we listent to `MatSelect` change
  public onChange(): void {
    this.emit();
  }

  // select the option by index
  private selectOption(index: number): void {
    if (index >= 0 && index < this.options.length) {
      this.selected = this.options[index].value;
      this.emit();
    }
  }

  private emit(): void {
    this.select.emit(this.selected);
  }
}
