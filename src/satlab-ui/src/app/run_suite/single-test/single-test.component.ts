import {IBuildSelectFields} from '../../models/run_suite_fields';
import {BuildSelectFormComponent} from '../common/build-select-form/build-select-form.component';
import {Component, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ISimpleDUT} from 'app/models/dut';
import {
  ICustomSettings,
  defaultBuildSelectFields,
} from 'app/models/run_suite_fields';
import {ITestCase} from 'app/models/testcase';
import {NotificationService} from 'app/services/notification.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {startWithTap} from 'app/utils/rxjs_operator';
import {checkSelectFields, isCustomBuild} from 'app/utils/validators';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-single-test',
  templateUrl: './single-test.component.html',
  styleUrls: ['./single-test.component.scss'],
})
export class SingleTestComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  protected disabled = true;
  protected testFormControl = new FormControl('');
  protected testCases: ITestCase[] = [];
  protected duts: ISimpleDUT[];
  protected settingsDisabled = false;
  protected isRunning = false;
  protected customSettings: ICustomSettings = {
    cft: true,
    trv2: false,
    uploadToCpcon: false,
  };

  private fields: IBuildSelectFields = defaultBuildSelectFields;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields = fields;
    this.settingsDisabled = isCustomBuild(fields.build);
    this.canRun();
  }

  // onAdvanceSettingsChanged handles the advanced settings changes
  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettings = newValue;
  }

  protected async onRunTestClick() {
    if (!this.validate()) {
      return;
    }
    // Set the `cft` flag, if the user sets the flag to `true`
    // and non custom build.
    const customBuild = isCustomBuild(this.fields.build);
    const cft = this.customSettings.cft && !customBuild;
    const trv2 = this.customSettings.trv2 && !customBuild;
    const uploadToCpcon =
      this.customSettings.trv2 && this.customSettings.uploadToCpcon;

    this.testCases.map(test => {
      this.service
        .runTest({
          ...this.fields,
          customSettings: {
            cft: cft,
            trv2: trv2,
            uploadToCpcon: uploadToCpcon,
            servoRequired: false,
          },
          tests: [test.name],
        })
        .pipe(
          startWithTap(() => {
            this.isRunning = true;
          }),
          finalize(() => {
            this.isRunning = false;
          })
        )
        .subscribe({
          next: buildLink => {
            this.notification.info(
              [
                `Trigger test ${test.name} successfully! Test link:`,
                {type: 'url', url: buildLink},
              ],
              {dismiss: false}
            );
          },
          error: err => {
            this.notification.error(
              `Trigger test ${test.name} failed! Error: ${err}`,
              {dismiss: false}
            );
          },
        });
    });
  }

  protected onAddTestClick() {
    const c = this.testFormControl.value.trim();
    if (c === '') {
      return;
    }
    this.testCases.push({name: c});
    this.testFormControl.setValue('');
    this.canRun();
  }

  protected onRemoveTestClick(index: number) {
    this.testCases.splice(index, 1);
    this.canRun();
  }

  private canRun() {
    this.disabled = !this.validate();
  }

  private validate() {
    const isFieldsValid = checkSelectFields(this.fields);

    const isTestValid = this.testCases.length > 0;

    return isFieldsValid && isTestValid;
  }
}
