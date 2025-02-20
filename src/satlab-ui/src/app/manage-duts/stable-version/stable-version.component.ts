import {AfterViewInit, ChangeDetectionStrategy, Component} from '@angular/core';
import {IDut} from 'app/models/dut';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {startWithTap} from 'app/utils/rxjs_operator';
import {finalize, from, tap} from 'rxjs';

@Component({
  selector: 'app-stable-version',
  templateUrl: './stable-version.component.html',
  styleUrls: ['./stable-version.component.scss'],
})
export class StableVersionComponent implements AfterViewInit {
  protected loading = false;

  protected data: {[key: string]: {[key: string]: boolean}} = {};

  constructor(private service: SatlabRpcService) {}

  ngAfterViewInit(): void {
    from(this.service.listDUTs())
      .pipe(
        startWithTap(() => (this.loading = true)),
        finalize(() => (this.loading = false)),
        tap(resp => {
          this.data = this.groupBy(resp);
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
