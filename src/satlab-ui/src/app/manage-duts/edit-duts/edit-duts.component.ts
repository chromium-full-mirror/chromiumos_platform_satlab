import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IDut} from "../../models/dut";
import {FormControl} from "@angular/forms";
import {SatlabRpcService} from "../../services/satlab-rpc.service";
import {toIterator} from "../../utils/iterator";
import {finalize, from} from "rxjs";
import {startWithTap} from "../../utils/rxjs_operator";

@Component({
  selector: 'app-edit-duts',
  templateUrl: './edit-duts.component.html',
  styleUrls: ['./edit-duts.component.scss']
})
export class EditDutsComponent {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Output() onDUTsUpdated = new EventEmitter();

  protected selectedDUTs: IDut[] = [];
  protected pool = new FormControl('');
  protected isDUTSelected = false;

  constructor(private service: SatlabRpcService) {}

  protected onDUTsSelectionChanged(d: IDut[]) {
    this.selectedDUTs = d;
    this.isDUTSelected = d.length > 0;
  }

  private __validate() {
    return this.pool.value && this.selectedDUTs.length > 0;
  }

  protected onAddClicked() {
    if (!this.__validate()) {
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

  protected onRemoveClicked() {
    if (!this.__validate()) {
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
