import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {IFirmwareDUT} from '../../models/dut';
import {SelectionModel} from '@angular/cdk/collections';
import {distinctUntilChanged, finalize, from, map, Subscription} from 'rxjs';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {toIterator} from '../../utils/iterator';
import {startWithTap} from '../../utils/rxjs_operator';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-firmware',
  templateUrl: './firmware.component.html',
  styleUrls: ['./firmware.component.scss'],
})
export class FirmwareComponent implements OnInit, AfterViewInit, OnDestroy {
  protected DUTs: IFirmwareDUT[] = [];
  protected loading = false;

  protected selection = new SelectionModel<IFirmwareDUT>(true, []);
  protected selectionCount = 0;
  protected checked = false;
  // The flag indicates if any DUTs can be updated.
  // If there are no DUTs that can be updated, it is `true`.
  // Otherwise, it is false. The default value is false.
  protected disabled = false;
  protected displayedColumns = ['check', 'ip', 'current', 'newest'];
  private disposer?: Subscription;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.disposer = this.selection.changed
      .pipe(
        map(e => e.source.selected.length),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.selectionCount = this.selection.selected.length;
        this.checked =
          this.selectionCount > 0 &&
          this.DUTs.filter(e => !e.isLatest).length === this.selectionCount;
      });
  }

  ngAfterViewInit(): void {
    this.__listDUTsForFirmware();
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  /**
   * list the DUTs for firmware update
   * @private
   */
  private __listDUTsForFirmware() {
    from(this.service.listDUTsForFirmware())
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: e => {
          this.DUTs = e;
        },
        error: e => {
          this.notification.error(`List firmware failed: ${e}`, {
            dismiss: false,
          });
        },
      });
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
        .filter(e => !e.isLatest)
        .forEach(e => {
          this.selection.toggle(e);
        });
    }
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
      )
      .subscribe({
        next: e => {
          e.map(res =>
            this.notification.info(
              `IP: ${res.address}, Message: ${res.message}`,
              {dismiss: false}
            )
          );
        },
        error: e => {
          this.notification.error(`Update firmware failed: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  /**
   * __validate a function that verify before calling the `update firmware`
   * @private
   */
  private __validate() {
    return this.selection.selected.length > 0;
  }
}
