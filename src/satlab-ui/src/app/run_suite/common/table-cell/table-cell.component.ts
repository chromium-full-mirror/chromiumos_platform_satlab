import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {
  ButtonCell,
  DateCell,
  LinkCell,
  StringCell,
} from 'app/run_suite/android/auto-qual/auto-qual.component';

@Component({
  selector: 'td[app-table-cell]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
})
export class TableCellComponent {
  @Input() cell: StringCell | DateCell | LinkCell | ButtonCell[];

  constructor() {}
}
