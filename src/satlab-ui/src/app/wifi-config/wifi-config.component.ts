import {Component, OnDestroy, OnInit} from '@angular/core';
import {IWifiInfo} from '../models/wifi';
import {FormControl} from '@angular/forms';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {startWithTap} from 'app/utils/rxjs_operator';
import {finalize, from} from 'rxjs';

@Component({
    selector: 'app-wifi-config',
    templateUrl: './wifi-config.component.html',
    styleUrls: ['./wifi-config.component.scss'],
    standalone: false
})
export class WifiConfigComponent implements OnInit {
  protected wifiInfo: IWifiInfo = {
    ssid: '',
    password: '',
  };
  protected wifiConfigLoading = false;
  protected ssidFormControl = new FormControl('');
  protected passwordFormControl = new FormControl('');

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.getWifiInfo();
  }

  onSetWifiInfoClicked() {
    this.setWifiInfo();
  }

  onResetWifiInfoClicked() {
    this.ssidFormControl.setValue('');
    this.passwordFormControl.setValue('');
    this.setWifiInfo();
  }

  onUndoClicked() {
    this.ssidFormControl.setValue(this.wifiInfo.ssid);
    this.passwordFormControl.setValue(this.wifiInfo.password);
  }

  protected getWifiInfo() {
    from(this.service.getDUTWifiInfo())
      .pipe(
        startWithTap(() => {
          this.wifiConfigLoading = true;
        }),
        finalize(() => {
          this.wifiConfigLoading = false;
        })
      )
      .subscribe({
        next: res => {
          this.wifiInfo = res;
          this.ssidFormControl.setValue(this.wifiInfo.ssid);
          this.passwordFormControl.setValue(this.wifiInfo.password);
        },
        error: e => {
          this.notification.error(`Get WiFi info failed: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  protected setWifiInfo() {
    from(
      this.service.setDUTWifiInfo({
        ssid: this.ssidFormControl.value.trim(),
        password: this.passwordFormControl.value.trim(),
      })
    )
      .pipe(
        startWithTap(() => {
          this.wifiConfigLoading = true;
        }),
        finalize(() => {
          this.wifiConfigLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.wifiInfo = {
            ssid: this.ssidFormControl.value.trim(),
            password: this.passwordFormControl.value.trim(),
          };
          this.notification.info(`Modify WiFi info success`);
        },
        error: e => {
          this.notification.error(`Modify WiFi info failed: ${e}`, {
            dismiss: false,
          });
        },
      });
  }
}
