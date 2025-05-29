import {Injectable} from '@angular/core';
import {finalize, from, timer} from 'rxjs';
import {SatlabRpcService} from './satlab-rpc.service';
import {NotificationService} from './notification.service';
import {CHECK_UPDATE_INTERVAL} from 'app/constants';
import {startWithTap} from 'app/utils/rxjs_operator';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  public updateState: boolean;
  public isLoading: boolean = false;
  private loaded: boolean = false;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {
    timer(0, CHECK_UPDATE_INTERVAL).subscribe(() => this.getUpdate());
  }

  public getUpdate() {
    from(this.service.isUpdateAvailable())
      .pipe(
        startWithTap(() => (this.isLoading = true)),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: res => {
          this.updateState = res;
          this.checkUpdate();
        },
        error: err => {
          this.notification.error(`Failed to get update status: ${err}`);
        },
      });
  }

  private checkUpdate() {
    if (this.loaded) {
      return;
    }
    if (this.updateState) {
      this.loaded = true;
      this.notification.info(`New version released, please reboot to update.`, {
        dismiss: false,
      });
    }
  }
}
