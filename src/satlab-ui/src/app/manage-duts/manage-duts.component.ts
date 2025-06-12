import {AUTO_REFRESH_INTERVAL, TESTLAB_STATUS_UNKNOWN} from '../constants';
import {IDut} from '../models/dut';
import {NotificationService} from '../services/notification.service';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {startWithTap} from '../utils/rxjs_operator';
import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {Subscription, finalize, from, interval} from 'rxjs';

@Component({
  selector: 'app-manage-duts',
  templateUrl: './manage-duts.component.html',
  styleUrls: ['./manage-duts.component.scss'],
})
export class ManageDutsComponent implements AfterViewInit, OnDestroy {
  // duts contains the all duts are enrolled and connected to the SatLab
  protected DUTs: IDut[] = [];
  // listDUTsLoading use to indicate we make an API call to list DUTs
  protected listDUTsLoading = false;
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
      this.disposer?.unsubscribe();
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
          this.__listTestlab(e);
        },
        error: e => {
          this.notification.error(`List DUTs failed: ${e}`, {dismiss: false});
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

  private async __listTestlab(duts: IDut[]) {
    const ds = duts.filter(dut => shouldGetTestlab(dut));

    for (const dut of ds) {
      try {
        await this.service.getTestlabEnabled(dut.address).then(res => {
          dut.testlabEnabled = res;
        });
      } catch (err) {
        this.notification.error(`Get ${dut.address} testlab failed: ${err}`, {
          dismiss: false,
        });
      }
    }

    this.DUTs = [
      ...ds,
      ...duts
        .filter(dut => !shouldGetTestlab(dut))
        .map(dut => ({...dut, testlabEnabled: TESTLAB_STATUS_UNKNOWN})),
    ];
  }
}
function shouldGetTestlab(dut: IDut): boolean {
  return dut.hasPermission && dut.isAccessible && dut.isConnected;
}
