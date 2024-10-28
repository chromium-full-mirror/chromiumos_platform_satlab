import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {IDut} from '../../models/dut';
import {SelectionModel} from '@angular/cdk/collections';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {toIterator} from '../../utils/iterator';
import {MatDialog} from '@angular/material/dialog';
import {StageBuildComponent} from '../../dialogs/stage-build/stage-build.component';
import {OpenCcdComponent} from 'app/dialogs/open-ccd/open-ccd.component';
import {delay} from 'rxjs';

@Component({
  selector: 'app-view-duts',
  templateUrl: './view-duts.component.html',
  styleUrls: ['./view-duts.component.scss'],
})
export class ViewDutsComponent implements OnChanges {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Input() hostnamePrefix = '';
  @Output() selectDUTs = new EventEmitter<IDut[]>();

  protected allSelected = false;
  protected selection = new SelectionModel<IDut>(true, []);
  protected selectionCount = 0;

  protected duts: IDut[] = [];

  protected disabledServo: string[] = [];

  protected displayedColumns = [
    'check',
    'ip',
    'hostname',
    'board',
    'model',
    'servo_serial',
    'ccd_status',
    'status',
    'pools',
    'mac',
  ];

  constructor(protected dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['DUTs'] &&
      changes['DUTs'].previousValue !== changes['DUTs'].currentValue
    ) {
      if (changes['DUTs'].previousValue) {
        this.duts = merge(this.duts, changes['DUTs'].currentValue);
      } else {
        this.duts = [...changes['DUTs'].currentValue];
      }

      if (this.selection && this.selection.selected.length > 0) {
        const s = find(this.selection, this.duts);
        this.selection.clear();
        s.forEach(e => this.#toggleDUT(e));
      }
    }
  }

  /**
   * listen an event that a single DUT checkbox has been changed
   * @param e which DUT has been changed
   * @protected
   */
  protected onDUTCheckboxChanged(e: IDut) {
    this.#toggleDUT(e);
  }

  /**
   * select a DUT.
   * @param d the DUT that we want to select.
   * @private
   */
  #toggleDUT(d: IDut) {
    this.selection.toggle(d);
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
        });
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
    const v = (e.target as HTMLInputElement).value.trim();
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
    };
    // find the dut in the DUTs list
    const idx = this.duts.indexOf(dut);
    // replace it to a new DUT
    this.duts = [
      ...this.duts.slice(0, idx),
      newDut,
      ...this.duts.slice(idx + 1),
    ];

    if (fire) {
      // find the dut in the selection
      const idx = this.selection.selected.indexOf(dut);
      this.selection.setSelection(
        ...[
          ...this.selection.selected.slice(0, idx),
          newDut,
          ...this.selection.selected.slice(idx + 1),
        ]
      );
      this.__emitSelectionChanged();
    }
  }

  private __validateHostname(s: string) {
    return /^[a-z0-9-]{1,32}$/.test(s);
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
    this.selectionCount = this.selection.selected.length;

    this.allSelected =
      this.selectionCount > 0 &&
      toIterator(this.duts)
        .filter(e => e.isAccessible)
        .collect().length === this.selectionCount;
  }

  /**
   * Emit the event when a user changed any checkbox.
   * @private
   */
  private __emitSelectionChanged() {
    this.selectDUTs.emit(this.selection.selected);
  }

  /**
   * Open CCD and testlab of DUT
   * @param servoSerial
   */
  protected onOpenCCDClicked(servoSerial: string) {
    this.disabledServo = [...this.disabledServo, servoSerial];
    const dialogRef = this.dialog.open(OpenCcdComponent, {
      data: {servoSerial: servoSerial},
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .pipe(delay(5000))
      .subscribe(() => {
        this.disabledServo = this.disabledServo.filter(
          ele => ele !== servoSerial
        );
      });
  }
}

/**
 * merge new DUTs.
 * if DUT has been enrolled, we use new one.
 * if DUT doesn't have test image, we use new one.
 * if DUT isn't enrolled. we merge the old state (e.g. the hostname that a user has input) to new one.
 * @param from the list of old DUTs
 * @param to the list of new DUTs
 */
function merge(from: IDut[], to: IDut[]) {
  // filter the DUTs that have been enrolled.
  const enrolled = toIterator(to)
    .filter(e => e.hostname !== '')
    .collect();

  // filter the DUTs are not enrolled and do not have test image.
  const withOutTestImage = toIterator(to)
    .filter(e => e.hostname === '' && !e.isConnected)
    .collect();

  // filter the DUTs that are not enrolled from old, we need copy the state from here.
  const old = toIterator(from)
    .filter(e => e.hostname === '' && e.isConnected)
    .collect();

  // filter the DUTs that are not enrolled from new, we need to update the state from old.
  const updated = toIterator(to)
    .filter(e => e.hostname === '' && e.isConnected)
    .collect();

  // update the new DUTs.
  const merged = toIterator(updated)
    .map(n => {
      return updateState(
        old.find(
          e =>
            e.address === n.address &&
            e.board === n.board &&
            e.model === n.model
        ),
        n
      );
    })
    .collect();

  return [...enrolled, ...merged, ...withOutTestImage];
}

/**
 * update the DUT state from old to new.
 * @param from the old DUT state
 * @param to the new DUT state
 */
function updateState(from: IDut | undefined, to: IDut) {
  return {
    ...to,
    inputHostname: from?.inputHostname,
  };
}

/**
 * find the old reference from the selection. the DUTs that we have selected.
 * @param selection the DUTs that we have selected
 * @param from the new reference of new DUTs
 */
function find(selection: SelectionModel<IDut>, from: IDut[]) {
  return toIterator(from)
    .filter(
      e =>
        selection.selected.find(obj => {
          if (obj.hostname === e.hostname && obj.hostname !== '') {
            return true;
          } else if (
            obj.address === e.address &&
            obj.board === e.board &&
            obj.model === e.model
          ) {
            return true;
          }
          return false;
        }) !== undefined
    )
    .collect();
}
