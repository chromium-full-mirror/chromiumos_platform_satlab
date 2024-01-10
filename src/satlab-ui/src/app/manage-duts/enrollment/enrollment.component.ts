import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IDut} from '../../models/dut';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {FormControl, Validators} from '@angular/forms';
import {toIterator} from '../../utils/iterator';
import {finalize, from} from 'rxjs';
import {startWithTap} from '../../utils/rxjs_operator';
import {MatDialog} from '@angular/material/dialog';
import {ProvisionComponent} from '../../dialogs/provision/provision.component';
import {NotificationService} from '../../services/notification.service';
import {runProvisionOnIndividualDUT} from '../../utils/run_tests_helper';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-enrollment',
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss'],
})
export class EnrollmentComponent {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Input() hostnamePrefix = '';
  @Input() autoRefreshFlag = false;

  @Output() updateDUTs = new EventEmitter();
  @Output() autoRefresh = new EventEmitter<boolean>();

  protected selectedDUTs: IDut[] = [];
  protected isDUTSelected = false;
  protected pool = new FormControl('', [
    Validators.pattern('[a-zA-Z0-9]+[a-zA-Z0-9-]*?'),
    Validators.maxLength(20),
  ]);

  constructor(
    private service: SatlabRpcService,
    protected dialog: MatDialog,
    private notification: NotificationService
  ) {}

  /**
   * A event listener listens the selection changed.
   * @param d
   * @protected
   */
  protected onDUTsSelectionChanged(d: IDut[]) {
    this.selectedDUTs = d;
    this.isDUTSelected = d.length > 0;
  }

  /**
   * A handler handles the DUTs that user wants to enroll
   * @protected
   */
  protected onEnrollClicked() {
    const d = toIterator(this.selectedDUTs)
      .filter(this.__canBeEnrolled)
      .collect();

    const duplicateHostname = this.__checkDuplicatedHostname(d);
    const emptyHostname = this.__checkEmptyHostname(d);
    const isServoWired = this.__checkServoWired(d);

    if (d.length === 0 || duplicateHostname || emptyHostname || isServoWired) {
      console.log('no DUTs to enroll or one of the DUTs has an issue');
      return;
    }
    console.log('proceeding to trigger addDUTs');

    from(this.service.addDUTs(d))
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: res => {
          res.pass.map(p =>
            this.notification.info(
              [
                `Start enrolling ${p.hostname} Link:`,
                {
                  type: 'url',
                  url: p.url,
                },
              ],
              {dismiss: false}
            )
          );
          res.fail.map(f =>
            this.notification.error(
              `Failed to enroll ${f.hostname}. Reason: ${f.reason}`,
              {dismiss: false}
            )
          );
          this.updateDUTs.emit();
        },
        error: e => {
          this.notification.error(`Something wrong with enroll: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  /**
   * A handler handles un-enrolled the selected DUTs
   * @protected
   */
  protected onUnEnrollClicked() {
    const d = toIterator(this.selectedDUTs)
      .filter(e => e.hostname !== '')
      .map(e => e.hostname)
      .collect();

    if (d.length === 0) {
      return;
    }

    from(this.service.deleteDUTs(d))
      .pipe(
        startWithTap(() => {
          this.loading = true;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: res => {
          res.pass.map(p =>
            this.notification.info(`Successfully unenrolled ${p}`, {
              dismiss: false,
            })
          );
          res.fail.map(f =>
            this.notification.info(`Failed to unenroll ${f}`, {dismiss: false})
          );
          this.updateDUTs.emit();
        },
        error: e => {
          this.notification.error(`Something wrong with unenroll: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  /**
   * A handler handles provision the DUTs that have been deployed.
   * @protected
   */
  protected onProvisionDUTs() {
    const d = toIterator(this.DUTs)
      .filter(e => e.hostname !== '')
      .collect();

    if (d.length === 0) {
      return;
    }
    const dialogRef = this.dialog.open(ProvisionComponent, {data: {duts: d}});

    dialogRef.afterClosed().subscribe(async res => {
      if (res) {
        this.loading = true;
        const result = await runProvisionOnIndividualDUT(
          this.service,
          d,
          res.milestone,
          res.build,
          res.pool
        );

        for (const f of result) {
          try {
            const r = await f;
            if (r.link) {
              this.notification.info(
                ['Provision succeed: ', {type: 'url', url: r.link}],
                {dismiss: false}
              );
            } else {
              this.notification.error(`${r.hostname} Provision failed`, {
                dismiss: false,
              });
            }
          } catch (e) {
            this.notification.error(`Provision failed: ${e}`, {dismiss: false});
          }
        }

        this.loading = false;
      }
    });
  }

  /**
   * A handler handles adding pool to the selected DUTs
   * @protected
   */
  protected onAddPoolClicked() {
    const addresses = toIterator(this.selectedDUTs)
      .filter(e => e.address !== '' && e.hostname !== '')
      .map(e => e.address)
      .collect();

    this.__checkIsDUTDeployed(this.selectedDUTs);

    if (addresses.length === 0 || !this.pool.value) {
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
        })
      )
      .subscribe({
        next: _ => {
          this.notification.info(`Add pool ${this.pool.value} successfully.`);
          this.updateDUTs.emit();
        },
        error: e => {
          this.notification.info(
            `Failed to add pool ${this.pool.value}: ${e}`,
            {dismiss: false}
          );
        },
      });
  }

  /**
   * a handler handles removing pool from selected DUTs
   * @protected
   */
  protected onRemovePoolClicked() {
    let items = toIterator(this.selectedDUTs)
      .filter(e => {
        return (
          e.address !== '' &&
          e.pools.includes(this.pool.value!) &&
          e.hostname !== ''
        );
      })
      .map(e => {
        const idx = e.pools.indexOf(this.pool.value!);
        return {
          address: e.address,
          pools: [...e.pools.slice(0, idx), ...e.pools.slice(idx + 1)],
        };
      })
      .collect();

    this.__checkIsDUTDeployed(this.selectedDUTs);
    this.__checkPoolsIsEmpty(items);

    items = toIterator(items)
      .filter(e => e.pools.length > 0)
      .collect();

    if (items.length === 0 || !this.pool.value) {
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
        })
      )
      .subscribe({
        next: _ => {
          this.notification.info(`Remove pool ${this.pool.value} successfully`);
          this.updateDUTs.emit();
        },
        error: e => {
          this.notification.error(
            `Failed to remove pool ${this.pool.value}: ${e}`,
            {dismiss: false}
          );
        },
      });
  }

  /**
   * an event handler handles a user wants to auto-refresh the page.
   * @param c the slide toggle change
   * @protected
   */
  protected autoRefreshChanged(c: MatSlideToggleChange) {
    this.autoRefresh.emit(c.checked);
  }

  /*
   * onRepairClicked an event handler to repair the selected DUTs.
   * @protected
   */
  protected onRepairClicked() {
    // filter all deployed DUTs
    const hostnames = toIterator(this.selectedDUTs)
      .filter(enrolled)
      .map(e => e.hostname)
      .collect();

    if (hostnames.length === 0) {
      return;
    }

    from(
      this.service.repairDuts({
        hostnames: hostnames,
        deep: true,
      })
    )
      .pipe(
        startWithTap(() => (this.loading = true)),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: res => {
          toIterator(res).forEach(e => {
            if (e.isSuccess) {
              this.notification.info(
                [
                  `Repair ${e.hostname} succeed: `,
                  {type: 'url', url: e.buildLink},
                ],
                {dismiss: false}
              );
            } else {
              this.notification.error(`failed to repair ${e.hostname}`, {
                dismiss: false,
              });
            }
          });
        },
        error: e => {
          this.notification.error(`failed to repair: ${JSON.stringify(e)}`);
        },
      });
  }

  /**
   * __canBeEnrolled checks the DUT can be enrolled.
   * @param d the information of DUT
   * @private
   */
  private __canBeEnrolled(d: IDut) {
    return (
      d.model && // model isn't empty
      d.board && // board isn't empty
      d.isConnected && // DUT is connected
      d.hostname === ''
    ); // DUT has not been deployed/enrolled already
  }

  /**
   * check a user input a duplicated hostname
   * @param d the list of DUTs that a user wants to deploy
   * @private
   */
  private __checkDuplicatedHostname(d: IDut[]) {
    const e: IDut[] = [];
    const hostnames = toIterator(this.DUTs)
      .filter(e => e.hostname !== '')
      .map(e => e.hostname)
      .collect();

    for (let i = 0; i < d.length; i++) {
      const cur = d[i];

      // check the user input hostname is in the list of deployed
      if (hostnames.includes(`${this.hostnamePrefix}${cur.inputHostname}`)) {
        e.push(cur);
      } else {
        // check the user is in the list of hostnames provided by the user again.
        const others = toIterator(d)
          .filter(e => e.address !== cur.address)
          .collect();

        for (const o of others) {
          if (o.inputHostname === cur.inputHostname) {
            e.push(cur);
            break;
          }
        }
      }
    }

    for (const m of e) {
      this.notification.error(
        `duplicate hostname: ${m.inputHostname} of DUT: ${m.address}`
      );
    }

    return e.length !== 0;
  }

  /**
   * check a user input a hostname is empty
   * @param d the list of DUTs that a user wants to deploy
   * @private
   */
  private __checkEmptyHostname(d: IDut[]) {
    const e = toIterator(d)
      .filter(e => !e.inputHostname)
      .collect();

    e.forEach(d =>
      this.notification.error(`Please input a hostname on ${d.address}`)
    );

    return e.length !== 0;
  }

  /**
   * check the DUTs' servo is wired
   * @param d the list of DUTs that a user wants to deploy
   * @private
   */
  private __checkServoWired(d: IDut[]) {
    const e = toIterator(d)
      .filter(e => !e.isServoWiredCorrectly)
      .collect();

    e.forEach(d =>
      this.notification.error(
        `Please make sure you are connecting Servo to the right port for ${d.address} : ${d.hostname}`
      )
    );

    return e.length !== 0;
  }

  /**
   * check and send a notification when a user attempt to remove all pools from a DUT
   * @param d
   * @private
   */
  private __checkPoolsIsEmpty(d: {address: string; pools: string[]}[]) {
    toIterator(d)
      .filter(e => e.pools.length === 0)
      .forEach(e => {
        this.notification.error(
          `can not remove pool: ${this.pool.value} for ${e.address} because pools cannot be empty.`
        );
      });
  }

  /**
   * check and send a notification when a user attempt to add/remove pools on an un-enrolled DUTs
   * @param d
   * @private
   */
  private __checkIsDUTDeployed(d: IDut[]) {
    toIterator(d)
      .filter(e => e.hostname === '')
      .forEach(e =>
        this.notification.error(
          `can not add/remove pool on a DUT ${e.address} that hasn't been enrolled`
        )
      );
  }
}

/**
 * check the DUT has been enrolled.
 */
function enrolled(d: IDut) {
  return d.hostname !== '';
}
