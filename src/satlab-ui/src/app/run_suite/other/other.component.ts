import {Component, ViewChild} from '@angular/core';
import {
  defaultBuildSelectFields,
  IBuildSelectFields,
  SelectableItem,
} from '../../models/selectable_item';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {BuildSelectFormComponent} from '../common/build-select-form/build-select-form.component';
import {finalize, from} from 'rxjs';
import {startWithTap} from '../../utils/rxjs_operator';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-other',
  templateUrl: './other.component.html',
  styleUrls: ['./other.component.scss'],
})
export class OtherComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  public suiteList: string[] = ['bvt-perbuild', 'audio'];

  protected suiteOptions: SelectableItem[] = [];
  protected disabled = true;
  private selectedSuite = '';
  private fields: IBuildSelectFields = defaultBuildSelectFields;

  constructor(
    private service: SatlabRpcService,
    private __snackBar: MatSnackBar
  ) {
    this.suiteOptions = this.suiteList.map(e => {
      return {
        text: e,
        value: e,
        label: '',
      };
    });
  }

  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields = fields;
    this.canRun();
  }

  protected onSuiteSelected(value: string) {
    this.selectedSuite = value;
    this.canRun();
  }

  protected onRunSuiteClick() {
    if (!this.validate()) {
      return;
    }

    from(this.service.runSuite({...this.fields, suite: this.selectedSuite}))
      .pipe(
        startWithTap(() => {
          this.disabled = true;
          this.form.showLoading('Running a suite...');
        }),
        finalize(() => {
          this.disabled = false;
          this.form.hideLoading();
        })
      )
      .subscribe({
        next: buildLink => {
          this.__snackBar.open(
            `Running a suite successful: Here is the link: ${buildLink}`,
            'Ok',
            {panelClass: 'normal'}
          );
        },
        error: e => {
          // Handle an error
          console.error(`Running a suite got an error: ${e}`);
        },
      });
  }

  private canRun() {
    this.disabled = !this.validate();
  }

  private validate() {
    const isFieldsValid = Object.entries(this.fields).reduce((p, [_, v]) => {
      return p && v !== '';
    }, true);

    const isSuiteValid = this.selectedSuite !== '';

    return isFieldsValid && isSuiteValid;
  }
}
