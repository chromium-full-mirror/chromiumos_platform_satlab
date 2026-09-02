import {CommonModule} from '@angular/common';
import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {
  ButtonCell,
  DateCell,
  LinkCell,
  Status,
  StatusCell,
  StringCell,
} from 'app/run_suite/android/auto-qual/auto-qual.component';

@Component({
  selector: 'td[app-table-cell]',
  imports: [CommonModule],
  templateUrl: './table-cell.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./table-cell.component.scss'],
})
export class TableCellComponent {
  @Input() cell?: StringCell | DateCell | LinkCell | StatusCell | ButtonCell[];

  constructor() {}

  getStatusClass(status: string): string {
    switch (status) {
      case Status.COMPLETED:
        return 'bg-green-100 text-green-800';
      case Status.FAILED:
        return 'bg-red-100 text-red-800';
      case Status.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case Status.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case Status.CANCELLED:
        return 'bg-orange-100 text-orange-800';
      case Status.UNKNOWN:
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
