import {Component, OnInit} from '@angular/core';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {
  ISystemInfo,
  IVersionInfo,
  INetworkInfo,
  ILinkInfo,
} from '../models/about';
import {from, finalize} from 'rxjs';
import {startWithTap} from '../utils/rxjs_operator';
import {NotificationService} from '../services/notification.service';
import {INSTRUCTION_URL, REPORT_BUG_URL} from "../constants";

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {
  protected loadingStatus = {
    systemInfo: false,
    versionInfo: false,
    networkInfo: false,
  };

  protected systemInfo: ISystemInfo = {
    cpuTemperature: 0,
    startTime: undefined,
  };

  protected versionInfo: IVersionInfo = {
    version: '',
    chromeosVersion: '',
    track: '',
    description: '',
    hostId: '',
  };

  protected networkInfo: INetworkInfo = {
    hostname: '',
    macAddress: '',
    isConnectedToInternet: false,
  };

  protected usefulLinks: ILinkInfo[] = [
    {
      name: 'Instruction Manual',
      url: INSTRUCTION_URL,
    },
    {
      name: 'Report a Bug',
      url: REPORT_BUG_URL,
    },
  ];

  constructor(
    private satlabRpcService: SatlabRpcService,
    private notification: NotificationService,
  ) {
  }

  ngOnInit(): void {
    this.getVersionInfo();
    this.getSystemInfo();
    this.getNetworkInfo();
  }

  /**
   * An event handler handles a user clicks a reboot button.
   * @protected
   */
  protected onRebootClicked() {
    from(this.satlabRpcService.reboot())
      .subscribe({
        next: _ => {
          this.notification.info('rebooting...', {dismiss: false})
        },
        error: err => {
          this.notification.error(`failed to reboot, ${err}`, {dismiss: false})
        }
      })
  }

  private getSystemInfo() {
    from(this.satlabRpcService.getSystemInfo())
      .pipe(
        startWithTap(() => {
          this.loadingStatus = {...this.loadingStatus, systemInfo: true};
        }),
        finalize(() => {
          this.loadingStatus = {...this.loadingStatus, systemInfo: false};
        })
      )
      .subscribe({
        next: res => {
          this.systemInfo = res;
        },
        error: e => {
          this.notification.error(`Get system info got an error: ${e}`, {dismiss: false});
        },
      });
  }

  private getVersionInfo() {
    from(this.satlabRpcService.getVersionInfo())
      .pipe(
        startWithTap(() => {
          this.loadingStatus = {...this.loadingStatus, versionInfo: true};
        }),
        finalize(() => {
          this.loadingStatus = {...this.loadingStatus, versionInfo: false};
        })
      )
      .subscribe({
        next: res => {
          this.versionInfo = res;
        },
        error: e => {
          this.notification.error(`Get version info got an error: ${e}`, {dismiss: false})
        },
      });
  }

  private getNetworkInfo() {
    from(this.satlabRpcService.getNetworkInfo())
      .pipe(
        startWithTap(() => {
          this.loadingStatus = {...this.loadingStatus, networkInfo: true};
        }),
        finalize(() => {
          this.loadingStatus = {...this.loadingStatus, networkInfo: false};
        })
      )
      .subscribe({
        next: res => {
          this.networkInfo = res;
        },
        error: e => {
          this.notification.error(`Get network info got an error: ${e}`, {dismiss: false})
        },
      });
  }
}
