import {Component, ViewChild} from '@angular/core';
import {SelectableItem} from '../../models/selectable_item';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {BuildSelectFormComponent} from '../common/build-select-form/build-select-form.component';
import {finalize, from} from 'rxjs';
import {startWithTap} from '../../utils/rxjs_operator';
import {NotificationService} from 'app/services/notification.service';
import {checkSelectFields, isCustomBuild} from '../../utils/validators';
import {
  defaultBuildSelectFields,
  IAdvancedSettings,
  IBuildSelectFields,
  defaultAdvancedSettings,
} from '../../models/run_suite_fields';
import {ISimpleDUT} from 'app/models/dut';

@Component({
  selector: 'app-other',
  templateUrl: './other.component.html',
  styleUrls: ['./other.component.scss'],
})
export class OtherComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  public suiteList: string[] = [
    'audio',
    'bvt-perbuild',
    'crosbolt_perf_perbuild',
    'graphics_per-build',
    'labqual',
    'labqual_informational',
  ];

  protected suiteOptions: SelectableItem[] = [];
  protected disabled = true;
  private suite = '';
  private fields: IBuildSelectFields = defaultBuildSelectFields;
  private advancedSettings: IAdvancedSettings = {...defaultAdvancedSettings};
  protected duts: ISimpleDUT[];
  protected settingsDisabled = false;

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

  protected allRequiredFieldsSet(fields: IBuildSelectFields) {
    this.fields = fields;
    this.settingsDisabled = isCustomBuild(fields.build);
    this.canRun();
  }

  protected onSuiteChanged(value: string) {
    this.suite = value.trim();
    this.canRun();
  }

  // onAdvanceSettingsChanged handles the advanced settings changes
  protected onAdvancedSettingsChanged(newValue: IAdvancedSettings) {
    this.advancedSettings = newValue;
  }

  protected onRunSuiteClick() {
    if (!this.validate()) {
      return;
    }
    // Set the `cft` flag, if the user sets the flag to `true`
    // and non custom build.
    const customBuild = isCustomBuild(this.fields.build);
    const cft = this.advancedSettings.cft && !customBuild;
    const trv2 = this.advancedSettings.trv2 && !customBuild;
    const uploadToCpcon =
      this.advancedSettings.trv2 && this.advancedSettings.uploadToCpcon;

    from(
      this.service.runSuite({
        ...this.fields,
        suite: this.suite,
        ...this.advancedSettings,
        cft: cft,
        trv2: trv2,
        uploadToCpcon: uploadToCpcon,
      })
    )
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

  private canRun() {
    this.disabled = !this.validate();
  }

  private validate() {
    const isFieldsValid = checkSelectFields(this.fields);

    const isSuiteValid = this.suite !== '';

    return isFieldsValid && isSuiteValid;
  }
}
