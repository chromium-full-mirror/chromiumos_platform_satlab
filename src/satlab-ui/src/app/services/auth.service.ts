import {Injectable} from '@angular/core';
import {SatlabRpcService} from './satlab-rpc.service'
import {BehaviorSubject, Observable, from} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private logSub = new BehaviorSubject<boolean>(false);
  public loginState$: Observable<boolean>;

  constructor(private rpcService: SatlabRpcService) {
    this.loginState$ = this.logSub.asObservable();
    from(this.rpcService.getCloudConfiguration())
      .subscribe({
        next: c => {
          this.logSub.next(c.key !== '');
        }
      })
  }

  public isLoggedIn() {
    return this.logSub.getValue();
  }
}
