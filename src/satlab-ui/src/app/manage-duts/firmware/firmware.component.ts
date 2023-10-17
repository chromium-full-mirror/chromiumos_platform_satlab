import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {IFirmwareDUT} from "../../models/dut";
import {SelectionModel} from "@angular/cdk/collections";
import {distinctUntilChanged, finalize, from, map, Subscription} from "rxjs";
import {SatlabRpcService} from "../../services/satlab-rpc.service";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {toIterator} from "../../utils/iterator";
import {startWithTap} from "../../utils/rxjs_operator";

@Component({
  selector: 'app-firmware',
  templateUrl: './firmware.component.html',
  styleUrls: ['./firmware.component.scss']
})
export class FirmwareComponent implements OnInit, OnChanges, OnDestroy {
  @Input() DUTs: IFirmwareDUT[] = [];
  @Input() loading = false;
  @Output() onDUTsUpdated = new EventEmitter();

  protected selection = new SelectionModel<IFirmwareDUT>(true, []);
  protected selectionCount = 0;
  private disposer?: Subscription;
  protected checked = false;

  protected displayedColumns = [
    'check',
    'ip',
    'current',
    'newest',
  ];

  constructor(private service: SatlabRpcService) {}

  ngOnInit() {
    this.disposer = this.selection
      .changed
      .pipe(
        map(e => e.source.selected.length),
        distinctUntilChanged(),
      )
      .subscribe(_ => {
        this.selectionCount = this.selection.selected.length;
      })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['DUTs'] && changes['DUTs'].previousValue !== changes['DUTs'].currentValue) {
      this.selection.clear();
      this.checked = false;
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
  protected onDUTCheckboxChanged(e: IFirmwareDUT) {
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
        .forEach(e => {
          this.selection.toggle(e);
        })
    }
  }

  /**
   * __validate a function that verify before calling the `update firmware`
   * @private
   */
  private __validate() {
    return this.selection.selected.length > 0;
  }

  /**
   * onUpdateClicked a handler when a user click the `Update` button.
   * @protected
   */
  protected onUpdateClicked() {
    if (!this.__validate()) {
      return;
    }

    const addresses = toIterator(this.selection.selected)
      .map(e => e.address)
      .collect();

    from(this.service.updateFirmware(addresses))
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
      next: e => {
        // TODO show the command output to notification
        console.log(e);
        this.onDUTsUpdated.emit();
      },
      error: e => {
        // TODO handle error
        console.error(e);
      }
    })
  }
}
