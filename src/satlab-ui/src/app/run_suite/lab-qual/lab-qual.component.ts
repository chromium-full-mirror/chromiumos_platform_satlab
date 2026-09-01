import {Component, OnDestroy, OnInit} from '@angular/core';
import {FIRMWARE_ARTIFACT} from 'app/constants';
import {
  defaultBuildSelectFields,
  IBuildSelectFields,
  ICustomSettings,
} from 'app/models/run_suite_fields';
import {NotificationService} from 'app/services/notification.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {checkSelectFields} from 'app/utils/validators';
import {BehaviorSubject, concatMap, map, Subscription, tap} from 'rxjs';
import {startWithTap} from 'app/utils/rxjs_operator';

@Component({
    selector: 'app-lab-qual',
    templateUrl: './lab-qual.component.html',
    styleUrls: ['./lab-qual.component.scss'],
    standalone: false
})
export class LabQualComponent implements OnInit, OnDestroy {
  // the parameters that we need to fill out.
  protected fields$: BehaviorSubject<IBuildSelectFields> = new BehaviorSubject({
    ...defaultBuildSelectFields,
  });
  // a flag that allows user to click on the run suite button.
  protected disabled = true;
  // loading status.
  protected loading = new BehaviorSubject<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  // A flag determines that user has seleced all basic information (board, model, etc...).
  protected isBasicInformationValid = false;
  protected isRunning = false;
  // The firmware that we want to run with.
  private firmware$: BehaviorSubject<{milestone: string; build: string}> =
    new BehaviorSubject({
      milestone: '',
      build: '',
    });
  // a subscription that subscripts the `fields` changes.
  private disposers: Subscription[];
  protected customSettings: ICustomSettings = {};

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.disposers = [
      // subscript the `fields` and `firmware` change
      // if any change happens, it will trigger `canRun` function.
      this.fields$.subscribe(() => this.canRun()),
      this.firmware$.subscribe(() => this.canRun()),
    ];
  }

  ngOnDestroy(): void {
    this.disposers.forEach(d => d.unsubscribe());
  }

  /**
   * handles a user select all basic parameters (board, model, etc...).
   * It will update the `fields` parameter.
   */
  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields$.next({...this.fields$, ...fields});
  }

  // onAdvanceSettingsChanged handles the advanced settings changes
  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettings = newValue;
  }

  /**
   * handles a user clicks on the run suite button.
   * It will validate all the required parameters, and if any
   * parameters are invalid, nothing happens here. Otherwise, it will call
   * the API to trigger the task.
   */
  protected onRunSuiteClick() {
    if (!this.canRun()) {
      return;
    }

    this.service
      .stageBuild(
        {
          ...this.fields$.value,
          build: this.firmware$.value.build,
          artifact: FIRMWARE_ARTIFACT,
        },
        'firmware'
      )
      .pipe(
        startWithTap(() => {
          this.disabled = true;
          this.isRunning = true;
          this.showLoading('staging firmware...');
        }),
        map(resp => {
          let filename = 'firmware_from_source.tar.bz2';
          if (!resp.path.endsWith('/')) {
            filename = `/${filename}`;
          }
          const path = `gs://${resp.bucket}/${resp.path}${filename}`;

          return {
            ...this.fields$.value,
            customSettings: {
              cft: true,
              trv2: false,
              uploadToCpcon: false,
              servoRequired: false,
            },
            path: path,
          };
        }),
        concatMap(req => {
          this.showLoading('runnning a suite...');
          return this.service.runLabQual(req);
        }),
        tap(resp => {
          this.notification.info(
            [
              'Trigger job successfully! Job link: ',
              {
                type: 'url',
                url: resp,
              },
            ],
            {dismiss: false}
          );
        })
      )
      .subscribe({
        error: err => {
          this.disabled = false;
          this.isRunning = false;
          this.hideLoading();
          this.notification.error(`Trigger job failed: ${err}`, {
            dismiss: false,
          });
        },
        complete: () => {
          this.disabled = false;
          this.isRunning = false;
          this.hideLoading();
        },
      });
  }

  /**
   * handles firmware has been changed.
   */
  protected onFirmwareChanged(newValue: {milestone: string; build: string}) {
    this.firmware$.next({...newValue});
  }

  /**
   * check if the all required parameters are valid, it
   * will set the disable flag to false, and allow a user to click
   * on the run suite button.
   */
  private canRun() {
    this.isBasicInformationValid = checkSelectFields(this.fields$.value);
    const isFirmwareValid =
      this.firmware$.value.milestone !== '' &&
      this.firmware$.value.build !== '';
    this.disabled = !(this.isBasicInformationValid && isFirmwareValid);
    return !this.disabled;
  }

  // hide the loading.
  private hideLoading() {
    this.setLoading(false, '');
  }

  // show the loading with the message.
  private showLoading(message: string) {
    this.setLoading(true, message);
  }

  // change the loading status by given values.
  private setLoading(show: boolean, message: string) {
    this.loading.next({show: show, message: message});
  }
}
