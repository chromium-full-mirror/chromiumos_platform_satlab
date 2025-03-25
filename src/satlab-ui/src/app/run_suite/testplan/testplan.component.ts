import {Component, ViewChild} from '@angular/core';
import {SelectableItem} from 'app/models/selectable_item';
import {ITestPlan} from 'app/models/testplan';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {startWithTap} from 'app/utils/rxjs_operator';
import {finalize, from, mergeAll, map, catchError, of, tap} from 'rxjs';
import {BuildSelectFormComponent} from '../common/build-select-form/build-select-form.component';
import {NotificationService} from '../../services/notification.service';
import {checkSelectFields, isCustomBuild} from '../../utils/validators';
import {
  defaultBuildSelectFields,
  IBuildSelectFields,
  ICustomSettings,
} from '../../models/run_suite_fields';
import {AutocompleteSelectorComponent} from '../common/autocomplete-selector/autocomplete-selector.component';
@Component({
  selector: 'app-testplan',
  templateUrl: './testplan.component.html',
  styleUrls: ['./testplan.component.scss'],
})
export class TestplanComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;
  @ViewChild(AutocompleteSelectorComponent)
  autocompleteSelector!: AutocompleteSelectorComponent;
  protected disabled = true;
  protected testPlanOptions: SelectableItem[] = [];
  protected fields: IBuildSelectFields = defaultBuildSelectFields;
  protected selectedTestPlan: ITestPlan[] = [];
  protected errorMessage = '';
  protected settingsDisabled = false;
  protected isRunning = false;
  protected customSettings: ICustomSettings = {
    cft: true,
    trv2: false,
    uploadToCpcon: false,
  };

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields = fields;
    this.settingsDisabled = isCustomBuild(fields.build);
    this.canRun();
  }

  // onAdvanceSettingsChanged handles the advanced settings changes.
  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettings = newValue;
  }

  protected listTestPlans() {
    from(this.service.listTestPlans())
      .pipe(
        startWithTap(() => {
          this.form.showLoading('fetching testplans...');
        }),
        finalize(() => {
          this.form.hideLoading();
        })
      )
      .subscribe({
        next: names => {
          this.testPlanOptions = names.map(n => {
            return {
              text: n,
              value: n,
              label: '',
            };
          });
          this.errorMessage =
            names.length === 0
              ? 'No test plan found, please upload one to bucket.'
              : '';
        },
        error: e => {
          // Handle an error.
          console.error(`Fetching testplan got an error: ${e}`);
          this.errorMessage = 'fetch test plans failed';
        },
      });
  }

  protected onSelectedTestPlanChanged(value: string) {
    this.selectedTestPlan.push({
      name: value,
      content: '',
    });
    this.autocompleteSelector.clear();
    this.canRun();
  }

  protected onRunTestPlanClick() {
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

    from(this.selectedTestPlan)
      .pipe(
        startWithTap(() => {
          this.form.showLoading('Triggering test plans...');
          this.disabled = true;
          this.isRunning = true;
        }),
        map(testPlan => {
          return from(
            this.service.runTestPlan({
              ...this.fields,
              plan: testPlan.name,
              customSettings: {
                cft: cft,
                trv2: trv2,
                uploadToCpcon: uploadToCpcon,
              },
            })
          ).pipe(
            catchError(err => {
              this.notification.error(
                `Trigger test plan failed! Error: ${err}`,
                {
                  dismiss: false,
                }
              );
              return of('');
            }),
            tap({
              next: buildLinks => {
                if (buildLinks === '') {
                  return;
                }

                buildLinks
                  .split(/\s/)
                  .forEach(link =>
                    this.notification.info(
                      [
                        `Trigger test plan ${testPlan.name} successfully! Test link:`,
                        {type: 'url', url: link},
                      ],
                      {dismiss: false}
                    )
                  );
              },
            })
          );
        }),
        mergeAll()
      )
      .subscribe({
        error: e => {
          // Handle an error.
          this.notification.error(`Trigger test plan failed: ${e}`, {
            dismiss: false,
          });
          this.form.hideLoading();
          this.isRunning = false;
        },
        complete: () => {
          this.form.hideLoading();
          this.selectedTestPlan = [];
          this.isRunning = false;
        },
      });
  }

  protected onRemoveTestPlanClick(index: number) {
    this.selectedTestPlan.splice(index, 1);
    this.canRun();
  }

  private canRun() {
    this.disabled = !this.validate();
  }

  private validate() {
    const isFieldsValid = checkSelectFields(this.fields);
    const isTestPlanValid = this.selectedTestPlan.length > 0;
    return isFieldsValid && isTestPlanValid;
  }
}
