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

  constructor(private service: SatlabRpcService) {
  }

  protected onDUTsSelectionChanged(d: IDut[]) {
    this.selectedDUTs = d;
    this.isDUTSelected = d.length > 0;
  }

  private __validateSelection(data: unknown[]) {
    return data.length > 0;
  }

  private __validateEditPool(data: unknown[]) {
    return this.__validateSelection(data) && this.pool.value;
  }

  protected onEnrollClicked() {
    const d = toIterator(this.selectedDUTs)
      .filter(e => e.inputHostname !== '' && e.board !== '' && e.model !== '' && e.isConnected && e.hostname === '')
      .collect();

    if (!this.__validateSelection(d)) {
      return;
    }

    from(this.service.addDUTs(d))
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: res => {
          // TODO: handle response
          console.log(res.pass)
          console.log(res.fail)
          this.onDUTsUpdated.emit();
        },
        error: e => {
          // TODO: handle error
          console.error(e);
        }
      })
  }

  protected onUnEnrollClicked() {
    const d = toIterator(this.selectedDUTs)
      .filter(e => e.address !== '')
      .map(e => e.address)
      .collect();

    if (!this.__validateSelection(d)) {
      return;
    }

    from(this.service.deleteDUTs(d))
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: res => {
          // TODO: handle response
          console.log(res.pass)
          console.log(res.fail)
          this.onDUTsUpdated.emit();
        },
        error: e => {
          // TODO: handle error
          console.error(e);
        }
      })
  }

  protected onReVerifyClicked() {
    if (!this.__validateSelection(this.selectedDUTs)) {
      return;
    }

    // TODO call an API to verify the DUTs
  }

  protected onProvisionDUTs() {
    // TODO show an dialog to let user to provision.
  }

  protected onAddPoolClicked() {
    const addresses = toIterator(this.selectedDUTs)
      .filter(e => e.address !== '')
      .map(e => e.address)
      .collect();

    if (!this.__validateEditPool(addresses)) {
      return;
    }

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
    const items = toIterator(this.selectedDUTs)
      .filter(e => {
        return e.address !== '' && e.pools.includes(this.pool.value!);
      })
      .map(e => {
        const idx = e.pools.indexOf(this.pool.value!);
        return {
          address: e.address,
          pools: [...e.pools.slice(0, idx), ...e.pools.slice(idx + 1)]
        }
      })
      .collect();

    if (!this.__validateEditPool(items)) {
      return;
    }

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
