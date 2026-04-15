import {Component, ViewChild} from '@angular/core';
import {
  defaultBuildSelectFields,
  defaultStorageQualFields,
  IBuildSelectFields,
  ICustomSettings,
  IPVSFields,
} from '../../../models/run_suite_fields';
import {SelectableItem} from '../../../models/selectable_item';
import {checkSelectFields} from '../../../utils/validators';
import {finalize, from} from 'rxjs';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {startWithTap} from '../../../utils/rxjs_operator';
import {BuildSelectFormComponent} from '../../common/build-select-form/build-select-form.component';
import {NotificationService} from '../../../services/notification.service';
import {MatButtonToggleChange} from '@angular/material/button-toggle';

const INDIVIDUAL_TEST = 'individual_test';
const SUITE = 'suite';
const TEST_PREFIX = 'tast.storage.';

@Component({
  selector: 'app-storage-qual',
  templateUrl: './storage-qual.component.html',
  styleUrls: ['./storage-qual.component.scss'],
})
export class StorageQualComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  protected disabled = true;
  protected fields: IBuildSelectFields & IPVSFields = {
    ...defaultBuildSelectFields,
    ...defaultStorageQualFields,
  };
  protected isRunning = false;

  protected suiteOptions: SelectableItem[] = [];
  // The value that user selected from toggle button (suite or test)
  protected toggleButtonValue = SUITE;

  private suiteList: string[] = [
    'storage-qual-avl-v3',
    'storage-qual-removable',
  ];
  private selectedSuite = '';
  private selectedTest = '';
  protected customSettings: ICustomSettings = {};

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {
    this.suiteOptions = this.suiteList.map(e => toSelectableItem(e));
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
    };
    this.disabled = !this.#validate();
  }

  // onAdvanceSettingsChanged handles the advanced settings changes
  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettings = newValue;
  }

  /**
   * onSuiteChanged The handler handles the test suite hase been changed.
   * @param newValue the new value of suite name
   * @protected
   */
  protected onSuiteChanged(newValue: string) {
    this.selectedSuite = newValue;
    this.disabled = !this.#validate();
  }

  /**
   * onTestChanged the handler handles the individual option has been changed.
   * @param newValue the new value of individual test
   * @protected
   */
  protected onTestChanged(newValue: string) {
    this.selectedTest = newValue;
    this.disabled = !this.#validate();
  }

  /* onSuiteOrTestChanged handles the toggle button has been changed.
   */
  protected onSuiteOrTestChanged(c: MatButtonToggleChange) {
    this.selectedSuite = '';
    this.selectedTest = '';
    if (c.value === SUITE || c.value === INDIVIDUAL_TEST) {
      this.toggleButtonValue = c.value;
    } else {
      console.error('unsupport toogle button value (suite or individual_test)');
    }
    this.disabled = !this.#validate();
  }

  /**
   * onBugIDChanged The handler handles the bug ID input box has been changed.
   * @protected
   * @param e
   */
  protected onBugIDChanged(value: string) {
    this.fields = {
      ...this.fields,
      bugID: value.trim(),
    };
    this.disabled = !this.#validate();
  }

  /**
   * onRunSuiteClick an event handler handles a user
   * click on a `Run Suite` Button
   * @protected
   */
  protected onRunSuiteClick() {
    if (!this.#validate()) {
      return;
    }

    from(
      this.service.runStorageQualification({
        ...this.fields,
        suite: this.toggleButtonValue === SUITE ? this.selectedSuite : '',
        test:
          this.toggleButtonValue === INDIVIDUAL_TEST
            ? this.__mayPrependPrefix(this.selectedTest)
            : '',
        customSettings: {...this.customSettings},
      })
    )
      .pipe(
        startWithTap(() => {
          this.isRunning = true;
          this.disabled = true;
          this.form.showLoading('Running a suite...');
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

  #validate() {
    const isFieldsValid = checkSelectFields(this.fields);
    const isTestValid =
      this.toggleButtonValue === SUITE
        ? this.selectedSuite !== ''
        : this.selectedTest !== '';
    return isFieldsValid && isTestValid;
  }

  /*
   * __mayPrependPrefix if the test prefix isn't there then add the prefix. Otherwise, keep the string.
   * Also, it will trim the string.
   */
  private __mayPrependPrefix(test: string) {
    const trimedTestName = test.trim();
    if (trimedTestName.startsWith(TEST_PREFIX)) {
      return trimedTestName;
    } else {
      return `${TEST_PREFIX}${trimedTestName}`;
    }
  }
}

function toSelectableItem(
  text: string,
  opts?: {
    toValue?: () => string;
    toLabel?: () => '' | 'Recommended' | 'Failed' | 'Running' | 'Aborted';
  }
): SelectableItem {
  return {
    text: text,
    value: opts?.toValue?.() ?? text,
    label: opts?.toLabel?.() ?? '',
  };
}
