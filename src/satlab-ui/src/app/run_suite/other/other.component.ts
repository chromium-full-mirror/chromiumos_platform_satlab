import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import {SelectableItem} from '../../models/selectable_item';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {BuildSelectFormComponent} from '../common/build-select-form/build-select-form.component';
import {finalize, from} from 'rxjs';
import {startWithTap} from '../../utils/rxjs_operator';
import {NotificationService} from 'app/services/notification.service';
import {checkSelectFields, isCustomBuild} from '../../utils/validators';
import {
  defaultBuildSelectFields,
  IBuildSelectFields,
  ICustomSettings,
} from '../../models/run_suite_fields';
import {ISimpleDUT} from 'app/models/dut';
import {FormControl} from '@angular/forms';
import {IWifiInfo} from 'app/models/wifi';

@Component({
  selector: 'app-other',
  templateUrl: './other.component.html',
  styleUrls: ['./other.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class OtherComponent implements OnInit {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  protected suiteList: string[] = [
    'audio',
    'crosbolt_perf_perbuild',
    'graphics_per-build',
  ];

  protected suiteOptions: SelectableItem[] = [];
  protected disabled = true;
  protected duts: ISimpleDUT[];
  protected settingsDisabled = false;
  protected isRunning = false;
  protected customSettings: ICustomSettings = {
    extraTestFilter: false,
    cft: true,
    trv2: false,
    uploadToCpcon: false,
  };
  protected tagIncludes = new FormControl('');
  protected tagExcludes = new FormControl('');
  protected testNameIncludes = new FormControl('');
  protected testNameExcludes = new FormControl('');

  private suite = '';
  private fields: IBuildSelectFields = defaultBuildSelectFields;
  private wifiInfo: IWifiInfo = {
    ssid: '',
    password: '',
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

  ngOnInit(): void {
    from(this.service.getDUTWifiInfo()).subscribe(res => (this.wifiInfo = res));
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
  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettings = newValue;
  }

  protected onRunSuiteClick() {
    if (!this.validate()) {
      return;
    }
    if (
      this.suite === 'cts' &&
      (this.wifiInfo.ssid === '' || this.wifiInfo.password === '')
    ) {
      this.notification.error(
        `Please make sure the WiFi configuration is set properly before running CTS`,
        {dismiss: false}
      );
      return;
    }
    // Set the `cft` flag, if the user sets the flag to `true`
    // and non custom build.
    const customBuild = isCustomBuild(this.fields.build);
    const cft = this.customSettings.cft && !customBuild;
    const trv2 = this.customSettings.trv2 && !customBuild;
    const uploadToCpcon =
      this.customSettings.trv2 && this.customSettings.uploadToCpcon;

    const tagIncludes = this.customSettings.extraTestFilter
      ? this.toTagList(this.tagIncludes.value)
      : [];
    const tagExcludes = this.customSettings.extraTestFilter
      ? this.toTagList(this.tagExcludes.value)
      : [];
    const testNameIncludes = this.customSettings.extraTestFilter
      ? this.toTagList(this.testNameIncludes.value)
      : [];
    const testNameExcludes = this.customSettings.extraTestFilter
      ? this.toTagList(this.testNameExcludes.value)
      : [];

    from(
      this.service.runSuite({
        ...this.fields,
        suite: this.suite,
        customSettings: {
          cft: cft,
          trv2: trv2,
          uploadToCpcon: uploadToCpcon,
          servoRequired: false,
        },
        tagIncludes: tagIncludes,
        tagExcludes: tagExcludes,
        testNameIncludes: testNameIncludes,
        testNameExcludes: testNameExcludes,
      })
    )
      .pipe(
        startWithTap(() => {
          this.disabled = true;
          this.isRunning = true;
          this.form.showLoading('Running a suite...');
        }),
        finalize(() => {
          this.disabled = false;
          this.isRunning = false;
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

  private toTagList(tagInput: string): string[] {
    return tagInput.trim()
      ? tagInput
          .trim()
          .split(',')
          .map(e => e.trim())
          .filter(e => e !== '')
      : [];
  }
}
