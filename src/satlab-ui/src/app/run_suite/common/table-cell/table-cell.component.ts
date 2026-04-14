import {CommonModule} from '@angular/common';
import {Component, Input, WritableSignal, signal} from '@angular/core';
import {AppModule} from 'app/app.module';

@Component({
  selector: 'td[app-table-cell]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
})
export class TableCellComponent {
  @Input() cellValue: WritableSignal<any> = signal(undefined);
  @Input() isLink: boolean = false;

  constructor() {}
}
