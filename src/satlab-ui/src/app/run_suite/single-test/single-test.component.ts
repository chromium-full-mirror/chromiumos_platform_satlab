import {Component, ViewChild} from '@angular/core';
import {BuildSelectFormComponent} from '../common/build-select-form/build-select-form.component';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {checkSelectFields, isCustomBuild} from 'app/utils/validators';
import {FormControl} from '@angular/forms';
import {catchError, from, map, mergeAll, of, tap} from 'rxjs';
import {startWithTap} from 'app/utils/rxjs_operator';
import {ITestCase} from 'app/models/testcase';
import {defaultBuildSelectFields} from 'app/models/run_suite_fields';
import {IBuildSelectFields} from '../../models/run_suite_fields';
import {ISimpleDUT} from 'app/models/dut';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

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
  private fields: IBuildSelectFields = defaultBuildSelectFields;
  protected isCFT = true;
  protected duts: ISimpleDUT[];
  protected isCustomBuild = false;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields = fields;
    this.isCustomBuild = isCustomBuild(this.fields.build);
    this.isCFT = !this.isCustomBuild && this.isCFT;
    this.canRun();
  }

  protected async onRunTestClick() {
    if (!this.validate()) {
      return;
    }

    from(this.testCases)
      .pipe(
        startWithTap(() => {
          this.form.showLoading('Triggering tests...');
          this.disabled = true;
        }),
        map(test => {
          return from(
            this.service.runTest({
              ...this.fields,
              cft: this.isCFT,
              tests: [test.name],
            })
          ).pipe(
            catchError(err => {
              this.notification.error(`Trigger test failed! Error: ${err}`, {
                dismiss: false,
              });
              return of('');
            }),
            tap({
              next: link => {
                if (link === '') {
                  return;
                }
                this.notification.info(
                  [
                    `Trigger test ${test.name} successfully! Test link:`,
                    {type: 'url', url: link},
                  ],
                  {dismiss: false}
                );
              },
            })
          );
        }),
        mergeAll()
      )
      .subscribe({
        complete: () => {
          this.form.hideLoading();
          this.testCases = [];
        },
      });
  }

  private canRun() {
    this.disabled = !this.validate();
  }

  private validate() {
    const isFieldsValid = checkSelectFields(this.fields);

    const isTestValid = this.testCases.length > 0;

    return isFieldsValid && isTestValid;
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

  protected onCFTChange(e: MatSlideToggleChange) {
    this.isCFT = e.checked;
  }
}
