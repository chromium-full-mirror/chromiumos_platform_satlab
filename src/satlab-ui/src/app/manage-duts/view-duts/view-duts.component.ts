import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {IDut} from "../../models/dut";
import {SelectionModel} from "@angular/cdk/collections";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {toIterator} from "../../utils/iterator";
import {MatDialog} from "@angular/material/dialog";
import {StageBuildComponent} from "../../dialogs/stage-build/stage-build.component";

@Component({
  selector: 'app-view-duts',
  templateUrl: './view-duts.component.html',
  styleUrls: ['./view-duts.component.scss']
})
export class ViewDutsComponent implements OnChanges {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Input() hostnamePrefix = "";
  @Output() select = new EventEmitter<IDut[]>();

  protected allSelected = false;
  protected selection = new SelectionModel<IDut>(true, []);
  protected selectionCount = 0;

  protected duts: IDut[] = [];

  protected displayedColumns = [
    'check',
    'ip',
    'hostname',
    'board',
    'model',
    'servo_serial',
    'status',
    'pools',
    'mac',
  ];

  constructor(protected dialog: MatDialog) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['DUTs'] && changes['DUTs'].previousValue !== changes['DUTs'].currentValue) {
      this.selection.clear();
      this.allSelected = false;
    }
    if (changes['DUTs']) {
      this.duts = changes['DUTs'].currentValue;
    }
  }

  /**
   * listen an event that a single DUT checkbox has been changed
   * @param e which DUT has been changed
   * @protected
   */
  protected onDUTCheckboxChanged(e: IDut) {
    this.selection.toggle(e);
    this.__selectionChanged();
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
      toIterator(this.duts)
        .filter(e => e.isAccessible)
        .forEach(e => {
          this.selection.toggle(e);
        })
    }
    this.__selectionChanged();
  }

  /**
   * checkSelectionContains check the DUT is in the selection.
   * @param dut this information of DUT
   * @private
   */
  private checkSelectionContains(dut: IDut) {
    for (const d of this.selection.selected) {
      if (d.address === dut.address) {
        return true;
      }
    }
    return false;
  }


  /**
   * onInputChange this is event that a user change the input
   * value and lost focus.
   * @param dut the information of DUT
   * @param e the input event
   * @protected
   */
  protected onInputFocusout(dut: IDut, e: Event) {
    const v = (e.target as HTMLInputElement).value.trim()
    if (!this.__validateHostname(v)) {
      return;
    }

    if (dut.inputHostname === v) {
      return;
    }
    const fire = this.checkSelectionContains(dut);
    // make a new DUT
    const newDut = {
      ...dut,
      inputHostname: v.trim(),
    }
    // find the dut in the DUTs list
    const idx = this.duts.indexOf(dut);
    // replace it to a new DUT
    this.duts = [
      ...this.duts.slice(0, idx),
      newDut,
      ...this.duts.slice(idx + 1),
    ]

    if (fire) {
      // find the dut in the selection
      const idx = this.selection.selected.indexOf(dut);
      this.selection.setSelection(...[
        ...this.selection.selected.slice(0, idx),
        newDut,
        ...this.selection.selected.slice(idx + 1),
      ]);
      this.select.emit(this.selection.selected);
    }
  }

  private __validateHostname(s: string) {
    return /^[a-z0-9-]{1,32}$/.test(s)
  }

  /**
   * a handler handles a user clicks on the `AccessTestBuild` Button
   * @protected
   */
  protected onAccessTestBuildClicked() {
    this.dialog.open(StageBuildComponent);
  }

  /**
   * a function handles any checkbox changed.
   * @private
   */
  private __selectionChanged() {
    // update how many DUTs have been selected
    this.__updateSelectionCount();

    // emit selection changed
    this.__emitSelectionChanged();
  }

  /**
   * update how many DUTs that a user has been selected
   * if all items have been selected, update the `allSelected` flag to true.
   * Otherwise, update it to false.
   * @private
   */
  private __updateSelectionCount() {
    this.selectionCount = this.selection.selected.length

    this.allSelected = this.selectionCount > 0 && toIterator(this.duts)
      .filter(e => e.isAccessible)
      .collect()
      .length === this.selectionCount;
  }

  /**
   * Emit the event when a user changed any checkbox.
   * @private
   */
  private __emitSelectionChanged() {
    this.select.emit(this.selection.selected)
  }
}
