import {AfterViewInit, Component} from '@angular/core';
import {IDut} from "../models/dut";
import {SatlabRpcService} from "../services/satlab-rpc.service";
import {finalize, from} from "rxjs";
import {startWithTap} from "../utils/rxjs_operator";
import {toIterator} from "../utils/iterator";

@Component({
  selector: 'app-manage-duts',
  templateUrl: './manage-duts.component.html',
  styleUrls: ['./manage-duts.component.scss']
})
export class ManageDutsComponent implements AfterViewInit {
  // duts contains the all duts are enrolled and connected to the SatLab
  protected DUTs: IDut[] = [];
  // enrolledDUTs contains the duts are enrolled
  protected enrolledDUTs: IDut[] = [];
  // listDUTsLoading use to indicate we make a API call to list DUTs
  protected listDUTsLoading = false;

  constructor(private service: SatlabRpcService) {}

  ngAfterViewInit() {
    this.listDUTs();
  }

  /**
   * listDUTs call an API to list all duts are connected and enrolled.
   * @private
   */
  private listDUTs() {
    from(this.service.listDUTs())
      .pipe(
        startWithTap(() => {
          this.listDUTsLoading = true;
        }),
        finalize(() => {
          this.listDUTsLoading = false;
        }),
      )
      .subscribe({
        next: e => {
          this.DUTs = e;
          this.enrolledDUTs = toIterator(this.DUTs)
            .filter(this.__isEnrolled)
            .collect();
        },
        error: e => {
          // TODO: handle error
          console.error(e);
        }
      })
  }

  /**
   * check the DUT is enrolled
   * @param d the structure contains all information of DUT.
   * @private
   */
  private __isEnrolled(d: IDut) {
    return d.model !== '' && d.board !== '';
  }

  /**
   * onDUTsUpdate is an handler to handle when any DUTs are updated.
   * @protected
   */
  protected onDUTsUpdated() {
    this.listDUTs();
  }
}
