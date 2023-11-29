import {Injectable} from '@angular/core';
import {SatlabRpcService} from './satlab-rpc.service';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private logSub = new BehaviorSubject<boolean>(false);
  public loginState$: Observable<boolean>;
  // __loaded is the flag indicates we have called the
  // `get_cloud_configuration`.
  //
  // Usually, there are two situations that require a change in status.
  // 1. The user logs in to a refreshed Chromebox. After the user has logged in,
  // the system will automatically reboot in this stage.
  //
  // 2. The user powerwashed the Chromebox. In this stage, the user also needs to reboot the system.
  //
  // we need to call the API once after the system reboots.
  private __loaded = false;

  constructor(private service: SatlabRpcService) {
    this.loginState$ = this.logSub.asObservable();
    this.__getConfiguration();
  }

  /**
   * __getConfiguration retrieves the `boto` key from the backend.
   * If the `key` is set, it means the user has logged in before.
   * @private
   */
  private async __getConfiguration() {
    try {
      const v = await this.service.getCloudConfiguration();
      this.__loaded = true;
      this.logSub.next(v.key !== '');
    } catch (e) {
      console.error(e);
    }
  }

  public async isLoggedIn() {
    if (!this.__loaded) {
      await this.__getConfiguration();
    }
    return this.logSub.getValue();
  }
}
