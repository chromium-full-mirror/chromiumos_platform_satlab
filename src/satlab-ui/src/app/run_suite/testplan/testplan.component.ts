import {Component, ViewChild} from '@angular/core';
import {SelectableItem} from 'app/models/selectable_item';
import {ITestPlan} from 'app/models/testplan';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {startWithTap} from 'app/utils/rxjs_operator';
import {finalize, from} from 'rxjs';
import {BuildSelectFormComponent} from '../common/build-select-form/build-select-form.component';
import {toIterator} from 'app/utils/iterator';
import {NotificationService} from '../../services/notification.service';
import {checkSelectFields} from '../../utils/validators';
import {
  defaultBuildSelectFields,
  IBuildSelectFields,
} from '../../models/run_suite_fields';

@Component({
  selector: 'app-testplan',
  templateUrl: './testplan.component.html',
  styleUrls: ['./testplan.component.scss'],
})
export class TestplanComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  protected disabled = true;
  protected testPlanOptions: SelectableItem[] = [];
  protected fields: IBuildSelectFields = defaultBuildSelectFields;
  protected selectedTestPlan?: ITestPlan;
  protected errorMessage = '';

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields = fields;
    this.canRun();
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
          // Handle an error
          console.error(`Fetching testplan got an error: ${e}`);
          this.errorMessage = 'fetch test plans failed';
        },
      });
  }

  protected onTestPlanChanged(value: string) {
    this.selectedTestPlan = {
      name: value,
      content: '',
    };
    this.canRun();
  }

  protected onRunTestPlanClick() {
    from(
      this.service.runTestPlan({
        ...this.fields,
        plan: this.selectedTestPlan.name,
      })
    )
      .pipe(
        startWithTap(() => {
          this.disabled = true;
          this.form.showLoading('Running a test plan...');
        }),
        finalize(() => {
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
          // Handle an error
          this.notification.error(`Trigger job failed: ${e}`, {dismiss: false});
        },
      });
  }

  private canRun() {
    this.disabled = !this.validate();
  }

  private validate() {
    const isFieldsValid = checkSelectFields(this.fields);

    const isTestPlanValid =
      toIterator(this.testPlanOptions)
        .filter(e => e.value === this.selectedTestPlan?.name)
        .collect().length > 0;

    return isFieldsValid && isTestPlanValid;
  }
}
