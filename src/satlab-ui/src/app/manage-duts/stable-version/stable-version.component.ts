import {AfterViewInit, Component} from '@angular/core';
import {IDut} from 'app/models/dut';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {startWithTap} from 'app/utils/rxjs_operator';
import {finalize, from, tap} from 'rxjs';
import {OSType} from '../../models/os';

@Component({
    selector: 'app-stable-version',
    templateUrl: './stable-version.component.html',
    styleUrls: ['./stable-version.component.scss'],
    standalone: false
})
export class StableVersionComponent implements AfterViewInit {
  protected loading = false;

  protected data: {[key: string]: {[key: string]: boolean}} = {};

  // OSOptions contains possible OS shown on Stable Version Page.
  protected OSOptions: OSType[] = ['chromeos', 'android'];
  // filterOS saves the state of chosen OS. It can be `chromeos`, `android` or both.
  protected filterOS: OSType | null = null;
  // filterOSBy determines which OS is chosen to filter.
  filterOSBy(value: OSType, checked: boolean) {
    if (checked) {
      this.filterOS = value;
    } else {
      this.filterOS = null;
    }
  }

  constructor(private service: SatlabRpcService) {}

  ngAfterViewInit(): void {
    from(this.service.listDUTs())
      .pipe(
        startWithTap(() => (this.loading = true)),
        finalize(() => (this.loading = false)),
        tap(resp => {
          this.data = this.groupBy(
            resp.filter(d => d.board !== '' && d.model !== '')
          );
        })
      )
      .subscribe();
  }

  /**
   * group by board and model.
   */
  private groupBy(DUTs: IDut[]) {
    const result = {};
    for (const d of DUTs) {
      if (!(d.board in result)) {
        result[d.board] = {};
      }
      result[d.board][d.model] = true;
    }

    return result;
  }
}
