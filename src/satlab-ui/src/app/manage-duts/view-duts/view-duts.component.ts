import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {IDut} from "../../models/dut";
import {SelectionModel} from "@angular/cdk/collections";
import {distinctUntilChanged, map, Subscription} from "rxjs";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {toIterator} from "../../utils/iterator";

@Component({
  selector: 'app-view-duts',
  templateUrl: './view-duts.component.html',
  styleUrls: ['./view-duts.component.scss']
})
export class ViewDutsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Output() select = new EventEmitter<IDut[]>();

  protected selection = new SelectionModel<IDut>(true, []);
  protected selectionCount = 0;
  private disposer?: Subscription;

  protected displayedColumns = [
    'check',
    'ip',
    'hostname',
    'board',
    'model',
    'servo_serial',
    'pools',
    'mac',
  ];

  constructor() {}

  ngOnInit() {
    this.disposer = this.selection
      .changed
      .pipe(
        map(e => e.source.selected.length),
        distinctUntilChanged(),
      )
      .subscribe(_ => {
        this.select.emit(this.selection.selected);
        this.selectionCount = this.selection.selected.length;
      })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['DUTs'] && changes['DUTs'].previousValue !== changes['DUTs'].currentValue) {
      this.selection.clear();
    }
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  /**
   * listen an event that a single DUT checkbox has been changed
   * @param e which DUT has been changed
   * @protected
   */
  protected onDUTCheckboxChanged(e: IDut) {
    this.selection.toggle(e);
  }

  /**
   * listen an event that all DUTs checkboxes have been changed
   * @param e this checkbox value, if checked is true, means all
   * DUTs are selected. Otherwise, all DUTs are un-selected.
   * @protected
   */
  protected onCheckboxChanged(e: MatCheckboxChange) {
    this.selection.clear();
    if (e.checked) {
      toIterator(this.DUTs)
        .filter(e => e.isConnected)
        .forEach(e => {
          this.selection.toggle(e);
        })
    }
  }
}
