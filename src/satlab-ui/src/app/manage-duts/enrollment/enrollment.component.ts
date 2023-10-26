import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IDut} from "../../models/dut";
import {SatlabRpcService} from "../../services/satlab-rpc.service";
import {FormControl} from "@angular/forms";
import {toIterator} from "../../utils/iterator";
import {finalize, from} from "rxjs";
import {startWithTap} from "../../utils/rxjs_operator";
import {MatDialog} from "@angular/material/dialog";
import {ProvisionComponent} from "../../dialogs/provision/provision.component";

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

  constructor(private service: SatlabRpcService, protected dialog: MatDialog) {
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
    const d = toIterator(this.DUTs)
      .filter(e => e.hostname !== '')
      .map(e => {
        return {
          board: e.board,
          model: e.model,
          pools: e.pools
        }
      })
      .collect();

    if (!this.__validateSelection(d)) {
      return;
    }

    const dialogRef = this.dialog.open(ProvisionComponent, {data: {duts: d}});

    dialogRef
      .afterClosed()
      .subscribe(res => {
        if (res) {
          const pool = res.pool;
          const milestone = res.milestone;
          const build = res.build;

          toIterator(d)
            .filter(e => e.pools.includes(pool))
            .unique_by_where((a, b) => {
              return a.board === b.board && a.model === b.model;
            })
            .map(e => {
              return {
                board: e.board,
                model: e.model,
              }
            })
            .collect()
            .forEach(e => {
              from(
                this.service.provision({
                  ...e,
                  milestone: milestone,
                  build: build,
                  pool: pool,
                })
              ).subscribe({
                next: e => {
                  // TODO: handle response
                  console.log(e)
                },
                error: e => {
                  // TODO: handle error
                  console.error(e)
                }
              })
            })
        }
      });
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
