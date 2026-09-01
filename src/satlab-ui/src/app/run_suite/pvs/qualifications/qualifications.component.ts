import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {ISimpleDUT} from 'app/models/dut';
import {
  defaultBuildSelectFields,
  defaultQualificationsFields,
  IBuildSelectFields,
  ICustomSettings,
  IQualificationsFields,
} from 'app/models/run_suite_fields';
import {
  BuildStatus,
  emptySelectableItem,
  SelectableItem,
} from 'app/models/selectable_item';
import {BuildSelectFormComponent} from 'app/run_suite/common/build-select-form/build-select-form.component';
import {NotificationService} from 'app/services/notification.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {toIterator} from 'app/utils/iterator';
import {startWithTap} from 'app/utils/rxjs_operator';
import {checkSelectFields} from 'app/utils/validators';
import {finalize, from} from 'rxjs';

@Component({
    selector: 'app-qualifications',
    templateUrl: './qualifications.component.html',
    styleUrls: ['./qualifications.component.scss'],
    standalone: false
})
export class QualificationsComponent implements AfterViewInit {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  protected satlabID: string;
  protected suite = '';
  protected disabled: boolean = true;
  protected isIncrementalRun: boolean = false;
  protected validFields: any;
  protected dlmSkuIDOptions: SelectableItem[] = [];
  protected suiteOptions: SelectableItem[] = [];
  protected suiteList: string[] = [
    'pre_fsi',
    'fsi',
    'firmware_rorw',
    'firmware_rw',
  ];
  protected duts: ISimpleDUT[];
  protected fields: IBuildSelectFields & IQualificationsFields = {
    ...defaultBuildSelectFields,
    ...defaultQualificationsFields,
  };
  protected isRunning = false;
  protected customSettings: ICustomSettings = {
    servoRequired: false,
  };

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {
    this.suiteOptions = this.suiteList.map(e => {
      return {
        text: e,
        value: e,
        label: '',
      };
    });
  }

  ngAfterViewInit() {
    this.#getSatlabID();
  }

  /**
   * The handler handles the basic fields have been changed.
   * @param fields the new value of fields.
   * @protected
   */
  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields = {
      ...this.fields,
      ...fields,
      pool: this.satlabID,
    };
    this.#parseEligibleDlmSkuIDs();
    this.disabled = !this.#validate();
  }

  // onAdvanceSettingsChanged handles the advanced settings changes
  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettings = newValue;
  }

  protected onDutListUpdate(dut: {duts: ISimpleDUT[]}) {
    this.duts = dut.duts;
  }

  /**
   * onSuiteChanged handles cases where the suite fields have been changed.
   * @param value the new value of suite.
   * @protected
   */
  protected onSuiteChanged(value: string) {
    this.suite = value.trim();
    this.fields = {
      ...this.fields,
      suite: this.suite,
    };
    this.disabled = !this.#validate();
  }

  /**
   * onBugIDChanged handles cases where the bugID fields have been changed.
   * @param e
   * @protected
   */
  protected onBugIDChanged(value: string) {
    this.fields = {
      ...this.fields,
      bugID: value.trim(),
    };
    this.disabled = !this.#validate();
  }

  /**
   * onDlmSkuIDChanged handles cases where the dlmSkuID fields have been changed.
   * @param dlmSkuID
   * @protected
   */
  protected onDlmSkuIDChanged(dlmSkuID: string) {
    this.fields = {
      ...this.fields,
      dlmSkuID: dlmSkuID,
    };
    this.disabled = !this.#validate();
  }

  protected onIncrementalRunChange(e: MatCheckboxChange) {
    this.fields = {
      ...this.fields,
      isIncrementalRun: (this.isIncrementalRun = e.checked),
    };
  }

  protected onRunSuiteClick() {
    from(
      this.service.runQualification({
        ...this.fields,
        customSettings: this.customSettings,
      })
    )
      .pipe(
        startWithTap(() => {
          this.isRunning = true;
          this.disabled = true;
          this.form.showLoading('Running a qualification...');
        }),
        finalize(() => {
          this.isRunning = false;
          this.disabled = false;
          this.form.hideLoading();
        })
      )
      .subscribe({
        next: buildLink => {
          this.notification.info(
            [
              'Trigger job successfully! Job link: ',
              {
                type: 'url',
                url: buildLink,
              },
            ],
            {dismiss: false}
          );
        },
        error: e => {
          this.notification.error(`Trigger job failed: ${e}`, {dismiss: false});
        },
      });
  }

  /**
   * Get the Satlab ID from the backend.
   */
  #getSatlabID() {
    from(this.service.getVersionInfo()).subscribe({
      next: resp => {
        this.satlabID = `satlab-${resp.hostId}`;
      },
      error: e => {
        this.notification.error(
          `can not fetch the satlab id, got an error: ${e} `
        );
      },
    });
  }

  #parseEligibleDlmSkuIDs(): void {
    this.dlmSkuIDOptions = [];
    if (this.fields.model !== '' && this.duts) {
      this.dlmSkuIDOptions = [
        emptySelectableItem,
        ...toIterator(this.duts)
          .filter(
            d => d.model === this.fields.model && d.board === this.fields.board
          )
          .map(e => e.dlmSkuID)
          .filter(e => e !== '')
          .unique_by()
          .map(e => this.#toSelectableItem(e, e, ''))
          .collect(),
      ];
    }
  }

  #toSelectableItem(
    text: string,
    value: string,
    label: BuildStatus
  ): SelectableItem {
    return {
      text: text,
      value: value,
      label: label,
    };
  }

  // validate verifies that all the required fields are filled.
  #validate() {
    this.validFields = {...this.fields};
    delete this.validFields.dlmSkuID;
    return checkSelectFields(this.validFields);
  }
}
