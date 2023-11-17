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
import {NotificationService} from 'app/services/notification.service';

@Component({
  selector: 'app-other',
  templateUrl: './other.component.html',
  styleUrls: ['./other.component.scss'],
})
export class OtherComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  public suiteList: string[] = ['audio', 'bvt-perbuild', 'crosbolt_perf_perbuild', 'graphics_per-build', 'labqual', 'labqual_informational'];

  protected suiteOptions: SelectableItem[] = [];
  protected disabled = true;
  private selectedSuite = '';
  private fields: IBuildSelectFields = defaultBuildSelectFields;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService,
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
          this.notification.info(['Trigger job successfully! Job link: ', {
            type: 'url',
            url: buildLink
          }], {dismiss: false})
        },
        error: e => {
          this.notification.error(`Trigger job failed: ${e}`, {dismiss: false})
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
