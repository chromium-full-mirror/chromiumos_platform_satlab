import {Component, ViewChild} from '@angular/core';
import {
  defaultBuildSelectFields,
  defaultStorageQualFields,
  IBuildSelectFields,
  IStorageQualFields,
} from '../../../models/run_suite_fields';
import {IItem} from '../../../models/selectable_item';
import {checkSelectFields} from '../../../utils/validators';
import {finalize, from} from 'rxjs';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {startWithTap} from '../../../utils/rxjs_operator';
import {BuildSelectFormComponent} from '../../common/build-select-form/build-select-form.component';
import {NotificationService} from '../../../services/notification.service';

@Component({
  selector: 'app-storage-qual',
  templateUrl: './storage-qual.component.html',
  styleUrls: ['./storage-qual.component.scss'],
})
export class StorageQualComponent {
  @ViewChild(BuildSelectFormComponent) form!: BuildSelectFormComponent;

  protected disabled = true;

  protected fields: IBuildSelectFields & IStorageQualFields = {
    ...defaultBuildSelectFields,
    ...defaultStorageQualFields,
  };

  private suiteList: string[] = [
    'storage-qual-avl-v3',
    'storage-qual-removable',
  ];
  protected suiteOptions: IItem[] = [];

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

  /**
   * onSuiteChanged The handler handles the test suite hase been changed.
   * @param newValue the new value of suite name
   * @protected
   */
  protected onSuiteChanged(newValue: string) {
    this.fields = {
      ...this.fields,
      suite: newValue.trim(),
    };
    this.disabled = !this.#validate();
  }

  /**
   * onBugIDChanged The handler handles the bug ID input box has been changed.
   * @protected
   * @param e
   */
  protected onBugIDChanged(e: Event) {
    this.fields = {
      ...this.fields,
      bugID: (e.target as HTMLInputElement).value.trim(),
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

    from(this.service.runStorageQualification(this.fields))
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

  #validate() {
    return checkSelectFields(this.fields);
  }
}
