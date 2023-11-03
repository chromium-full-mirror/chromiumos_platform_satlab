import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IDut} from "../../models/dut";
import {SatlabRpcService} from "../../services/satlab-rpc.service";
import {FormControl} from "@angular/forms";
import {toIterator} from "../../utils/iterator";
import {finalize, from} from "rxjs";
import {startWithTap} from "../../utils/rxjs_operator";
import {MatDialog} from "@angular/material/dialog";
import {ProvisionComponent} from "../../dialogs/provision/provision.component";
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-enrollment',
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss']
})
export class EnrollmentComponent {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Input() hostnamePrefix = "";
  @Output() onDUTsUpdated = new EventEmitter();

  protected selectedDUTs: IDut[] = [];
  protected isDUTSelected = false;
  protected pool = new FormControl('');

  constructor(
    private service: SatlabRpcService,
    protected dialog: MatDialog,
    private notification: NotificationService) {
  }

  protected onDUTsSelectionChanged(d: IDut[]) {
    this.selectedDUTs = d;
    this.isDUTSelected = d.length > 0;
  }

  protected onEnrollClicked() {
    const d = toIterator(this.selectedDUTs)
      .filter(this.__canBeEnrolled)
      .collect();

    // Show some error notification to user
    // when user doesn't input a hostname or servo is not wired correctky.
    toIterator(this.selectedDUTs)
      .filter(e => e.hostname === '')
      .filter(e =>
        !e.inputHostname || !e.isServoWiredCorrectly
      )
      .forEach(e => {
        if (!e.inputHostname && e.hostname) {
          this.notification.error(`Please input a hostname on ${e.address}`)
        }
        if (!e.isServoWiredCorrectly) {
          this.notification.error(`Please make sure you are connecting Servo to the right port for ${e.address} : ${e.hostname}`)
        }
      })

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
          res.pass.map(
            p => this.notification.info([`Start enrolling ${p.hostname} Link:`, {
              type: 'url',
              url: p.url
            }], {dismiss: false})
          )
          res.fail.map(
            f => this.notification.info(`Failed to enroll ${f.hostname}. Reason: ${f.reason}`, {dismiss: false})
          )
          this.onDUTsUpdated.emit();
        },
        error: e => {
          this.notification.error(`Something wrong with enroll: ${e}`, {dismiss: false})
        }
      })
  }

  protected onUnEnrollClicked() {
    const d = toIterator(this.selectedDUTs)
      .filter(e => e.hostname !== '')
      .map(e => e.hostname)
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
          res.pass.map(
            p => this.notification.info(`Successfully unenrolled ${p}`, {dismiss: false})
          )
          res.fail.map(
            f => this.notification.info(`Failed to unenroll ${f}`, {dismiss: false})
          )
          this.onDUTsUpdated.emit();
        },
        error: e => {
          this.notification.error(`Something wrong with unenroll: ${e}`, {dismiss: false})
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
                  this.notification.info(['Provision succeed: ', {type: 'url', url: e}], {dismiss: false})
                },
                error: e => {
                  this.notification.error(`Provision failed: ${e}`, {dismiss: false})
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
          this.notification.info(`Add pool ${this.pool.value} successfully.`)
          this.onDUTsUpdated.emit();
        },
        error: e => {
          this.notification.info(`Failed to add pool ${this.pool.value}: ${e}`, {dismiss: false})
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
          this.notification.info(`Remove pool ${this.pool.value} successfully`)
          this.onDUTsUpdated.emit();
        },
        error: e => {
          this.notification.error(`Failed to remove pool ${this.pool.value}: ${e}`, {dismiss: false})
        }
      })
  }

  /**
   * __canBeEnrolled checks the DUT can be enrolled.
   * @param d the information of DUT
   * @private
   */
  private __canBeEnrolled(d: IDut) {
    return d.inputHostname         // input hostname isn't empty
      && d.model                   // model isn't empty
      && d.board                   // board isn't empty
      && d.isConnected             // DUT is connected
      && d.hostname                // DUT doesn't been deployed
      && d.isServoWiredCorrectly;  // servo is empty or servo works
  }

  /**
   * __validateSelection checks the given data is empty or not
   * @param data
   * @private
   */
  private __validateSelection(data: unknown[]) {
    return data.length > 0;
  }

  /**
   * __validateEditPool checks the given data is empty or not and
   * the pool is empty or not
   * @param data
   * @private
   */
  private __validateEditPool(data: unknown[]) {
    return this.__validateSelection(data) && this.pool.value;
  }
}
