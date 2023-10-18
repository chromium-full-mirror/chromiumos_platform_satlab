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
      url: 'https://docs.google.com/document/d/e/2PACX-1vQKDTDTQFKjNxJatFkFUSjCPdVzgry9vkLLvxL8vwqasrKMP2KReEMZ3iva9GX8EzQYo-kANnzPlFG_/pub?urp=gmail_link',
    },
    {
      name: 'Report a Bug',
      url: 'https://issuetracker.google.com/issues/new?component=1038089&template=1569787',
    },
  ];

  constructor(private satlabRpcService: SatlabRpcService) {}

  ngOnInit(): void {
    this.getVersionInfo();
    this.getSystemInfo();
    this.getNetworkInfo();
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
          // TODO: show error to user.
          console.error(`Get system info got an error: ${e}`);
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
          // TODO: show error to user.
          console.error(`Get version info got an error: ${e}`);
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
          // TODO: show error to user.
          console.error(`Get network info got an error: ${e}`);
        },
      });
  }
}
