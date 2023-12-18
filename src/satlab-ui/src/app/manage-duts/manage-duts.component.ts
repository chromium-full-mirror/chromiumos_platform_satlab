import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {IDut, IFirmwareDUT} from '../models/dut';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {finalize, from, interval, Subscription} from 'rxjs';
import {startWithTap} from '../utils/rxjs_operator';
import {NotificationService} from '../services/notification.service';
import {AUTO_REFRESH_INTERVAL} from '../constants';

@Component({
  selector: 'app-manage-duts',
  templateUrl: './manage-duts.component.html',
  styleUrls: ['./manage-duts.component.scss'],
})
export class ManageDutsComponent implements AfterViewInit, OnDestroy {
  // duts contains the all duts are enrolled and connected to the SatLab
  protected DUTs: IDut[] = [];
  // firmwareDUTs contains the connected DUTs that including the firmware information
  protected firmwareDUTs: IFirmwareDUT[] = [];
  // listDUTsLoading use to indicate we make an API call to list DUTs
  protected listDUTsLoading = false;
  // listFirmwareLoading use to indicate we make an API call to list DUTs for firmware update
  protected listFirmwareLoading = false;
  // hostnamePrefix the prefix of hostname when a user want to input a hostname.
  // we need to show a prefix.
  protected hostnamePrefix = '';
  // the flag to indicate a user wants to auto-refresh
  // define here is to keep the state of auto-refresh button.
  protected autoRefreshListDUTs = false;
  private disposer?: Subscription;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngAfterViewInit() {
    this.__getHostnamePrefix();
    this.__listDUTs();
    this.__listDUTsForFirmware();
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  /**
   * onDUTsUpdate is a handler to handle when any DUTs are updated.
   * @protected
   */
  protected onDUTsUpdated() {
    this.__listDUTs();
  }

  /**
   * onFirmwareUpdated is a handler to handle when any DUTs update a firmware
   * @protected
   */
  protected onFirmwareUpdated() {
    this.__listDUTsForFirmware();
  }

  /**
   * onAutoRefreshBtnClicked is an event handler handles the auto-refresh button
   * clicked.
   * @param checked
   * @protected
   */
  protected onAutoRefreshBtnClicked(checked: boolean) {
    this.autoRefreshListDUTs = checked;
    if (checked) {
      this.disposer = interval(AUTO_REFRESH_INTERVAL).subscribe({
        next: _ => this.__listDUTs(),
      });
    } else {
      this.disposer = null;
    }
  }

  /**
   * listDUTs call an API to list all duts are connected and enrolled.
   * @private
   */
  private __listDUTs() {
    from(this.service.listDUTs())
      .pipe(
        startWithTap(() => {
          this.listDUTsLoading = true;
        }),
        finalize(() => {
          this.listDUTsLoading = false;
        })
      )
      .subscribe({
        next: e => {
          this.DUTs = e;
        },
        error: e => {
          this.notification.error(`List DUTs failed: ${e}`, {dismiss: false});
        },
      });
  }

  /**
   * list the DUTs for firmware update
   * @private
   */
  private __listDUTsForFirmware() {
    from(this.service.listDUTsForFirmware())
      .pipe(
        startWithTap(() => {
          this.listFirmwareLoading = true;
        }),
        finalize(() => {
          this.listFirmwareLoading = false;
        })
      )
      .subscribe({
        next: e => {
          this.firmwareDUTs = e;
        },
        error: e => {
          this.notification.error(`List firmware failed: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  private __getHostnamePrefix() {
    from(this.service.getVersionInfo()).subscribe({
      next: e => {
        this.hostnamePrefix = `satlab-${e.hostId}-`;
      },
      error: e => {
        this.notification.error(`Get hostname failed: ${e}`, {dismiss: false});
      },
    });
  }
}
