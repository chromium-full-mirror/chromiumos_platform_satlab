import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IDut} from "../../models/dut";
import {SatlabRpcService} from "../../services/satlab-rpc.service";
import {FormControl} from "@angular/forms";
import {toIterator} from "../../utils/iterator";
import {finalize, from} from "rxjs";
import {startWithTap} from "../../utils/rxjs_operator";

@Component({
  selector: 'app-enrollment',
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss']
})
export class EnrollmentComponent {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Output() onDUTsUpdated = new EventEmitter();

  protected selectedDUTs: IDut[] = [];
  protected isDUTSelected = false;
  protected pool = new FormControl('');

  constructor(private service: SatlabRpcService) {}

  protected onDUTsSelectionChanged(d: IDut[]) {
    this.selectedDUTs = d;
    this.isDUTSelected = d.length > 0;
  }

  private __validateSelection() {
    return this.selectedDUTs.length > 0;
  }

  private __validateEditPool() {
    return this.__validateSelection() && this.pool.value;
  }

  protected onEnrollClicked() {
    if (!this.__validateSelection()) {
      return ;
    }

    // TODO call an API to add DUTs
  }

  protected onUnEnrollClicked() {
    if (!this.__validateSelection()) {
      return ;
    }

    // TODO call an API to delete DUTs
  }

  protected onReVerifyClicked() {
    if (!this.__validateSelection()) {
      return ;
    }

    // TODO call an API to verify the DUTs
  }

  protected onProvisionDUTs () {
    // TODO show an dialog to let user to provision.
  }

  protected onAddPoolClicked() {
    if (!this.__validateEditPool()) {
      return ;
    }

    const addresses = toIterator(this.selectedDUTs)
      .map(e => e.address)
      .collect();

    from(this.service.addPool({addresses: addresses, pool: this.pool.value!}))
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
          this.pool.setValue('');
        }),
      )
      .subscribe({
        next: _ => {
          this.onDUTsUpdated.emit();
        },
        error: e => {
          // TODO: handle error
          console.error(e);
        }
      })
  }

  protected onRemovePoolClicked() {
    if (!this.__validateEditPool()) {
      return ;
    }

    const items = toIterator(this.selectedDUTs)
      .filter(e => {
        return e.pools.includes(this.pool.value!);
      })
      .map(e => {
        const idx = e.pools.indexOf(this.pool.value!);
        return {
          address: e.address,
          pools: [...e.pools.slice(0, idx), ...e.pools.slice(idx+1)]
        }
      })
      .collect();

    from(this.service.updatePool(items))
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
          this.pool.setValue('');
        }),
      )
      .subscribe({
        next: _ => {
          this.onDUTsUpdated.emit();
        },
        error: e => {
          // TODO: handle error
          console.error(e);
        }
      })
  }
}
