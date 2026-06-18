import {AfterViewInit, Component} from '@angular/core';
import {IDut} from 'app/models/dut';
import {
  defaultBuildSelectFields,
  ICustomSettings,
} from 'app/models/run_suite_fields';
import {BuildStatus, SelectableItem} from 'app/models/selectable_item';
import {NotificationService} from 'app/services/notification.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {toIterator} from 'app/utils/iterator';
import {startWithTap} from 'app/utils/rxjs_operator';
import {checkSelectFields, isCustomBuild} from 'app/utils/validators';
import {BehaviorSubject, finalize, from} from 'rxjs';

@Component({
  selector: 'app-pasit',
  templateUrl: './pasit.component.html',
  styleUrls: ['./pasit.component.scss'],
})
export class PasitComponent implements AfterViewInit {
  loading = new BehaviorSubject<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  duts: IDut[] = [];
  protected loading$ = this.loading.asObservable();
  protected fields = defaultBuildSelectFields;
  protected hostnameOptions: SelectableItem[] = [];
  protected suiteList: string[] = [
    'pasit_fast',
    'pasit_full',
    'pasit_storage',
    'pasit_camera',
    'pasit_hid',
    'pasit_display',
    'pasit_pd',
  ];
  protected suiteOptions: SelectableItem[] = [];
  private suite = '';
  protected customSettings: ICustomSettings = {
    cft: true,
    trv2: false,
    uploadToCpcon: false,
  };
  protected topologyContent: string = '';
  protected disabled = true;
  protected isRunning = false;
  protected isUpdatingTopology = false;
  protected updateTopologyDisabled = true;
  protected tagsToInclude: string[] = [];
  protected disableInputOnTrigger = false;

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

  ngAfterViewInit(): void {
    from(this.service.listDUTs())
      .pipe(
        startWithTap(() => this.showLoading('Fetching DUTs ...')),
        finalize(() => this.hideLoading())
      )
      .subscribe({
        next: d => {
          (this.duts = d), this.#parseHostnameOptionsFromDUTs(d);
        },
        error: e => {
          this.notification.error('Cannot fetch DUTs properly', {
            dismiss: false,
          });
        },
      });
  }

  protected showLoading(message: string) {
    this.loading.next({show: true, message: message});
  }

  protected hideLoading() {
    this.loading.next({show: false, message: ''});
  }

  protected onHostnameChanged(selectedHostname: string) {
    this.topologyContent = '';
    const pool = this.duts.find(e => e.hostname === selectedHostname);
    if (!pool && pool.pools.length > 0) {
      return;
    }

    this.fields = {
      ...this.fields,
      board: pool.board,
      model: pool.model,
      pool: pool.pools[0],
      dims: {
        dut_name: selectedHostname,
      },
    };
    this.#getTopology(selectedHostname);
    this.canRun();
    this.canUpdateTopology();
  }

  #getTopology(hostname: string) {
    from(this.service.getTopology(hostname)).subscribe({
      next: t => (this.topologyContent = t),
      error: e =>
        this.notification.error(`Failed to get topology: ${e}`, {
          dismiss: false,
        }),
    });
  }

  #parseHostnameOptionsFromDUTs(duts: IDut[]) {
    this.hostnameOptions = toIterator(duts)
      .filter(e => e.hostname != '')
      .map(e => e.hostname)
      .map(e => this.#toSelectableItem(e, e, ''))
      .collect();
  }

  protected onBuildChanged(newValue: {milestone: string; build: string}) {
    this.fields = {
      ...this.fields,
      ...newValue,
    };
    this.canRun();
  }

  #toSelectableItem(
    text: string,
    value: string,
    label: BuildStatus
  ): SelectableItem {
    return {
      text: text,
      value: value,
      label: label,
    };
  }

  protected onSuiteChanged(value: string) {
    this.suite = value.trim();
    this.canRun();
  }

  protected onRunPasitClick() {
    if (!this.validate()) {
      return;
    }
    this.#triggerRunOnPasit();
  }

  protected onUpdateTopologyClick() {
    if (!this.fields.dims?.dut_name) {
      return;
    }
    from(
      this.service.addTopology({
        hostname: this.fields.dims.dut_name,
        content: this.topologyContent,
      })
    )
      .pipe(
        startWithTap(() => {
          this.isUpdatingTopology = true;
          this.disableInputOnTrigger = true;
          this.canRun();
          this.canUpdateTopology();
          this.showLoading('Updating Topology...');
        }),
        finalize(() => {
          this.hideLoading();
          this.#resetController();
        })
      )
      .subscribe({
        next: () => {
          this.notification.info('Topology updated successfully!', {
            dismiss: false,
          });
        },
        error: e => {
          this.notification.error(`Failed to update topology: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  #triggerRunOnPasit() {
    const customBuild = isCustomBuild(this.fields.build);
    const cft = this.customSettings.cft && !customBuild;
    const trv2 = this.customSettings.trv2 && !customBuild;
    const uploadToCpcon =
      this.customSettings.trv2 && this.customSettings.uploadToCpcon;
    this.tagsToInclude = ['group:pasit', this.suite];

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
        tagIncludes: this.tagsToInclude,
        tagExcludes: [],
        testNameIncludes: [],
        testNameExcludes: [],
      })
    )
      .pipe(
        startWithTap(() => {
          this.isRunning = true;
          this.disableInputOnTrigger = true;
          this.canRun();
          this.canUpdateTopology();
          this.showLoading('Running a suite...');
          console.log(this.tagsToInclude);
        }),
        finalize(() => {
          this.#resetController();
          this.hideLoading();
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

  #resetController() {
    this.isRunning = false;
    this.isUpdatingTopology = false;
    this.disableInputOnTrigger = false;
    this.canRun();
    this.canUpdateTopology();
  }

  protected onAdvancedSettingsChanged(newValue: ICustomSettings) {
    this.customSettings = newValue;
  }

  private canRun() {
    this.disabled = !this.validate() || this.isRunning || this.isUpdatingTopology;
  }

  private canUpdateTopology() {
    this.updateTopologyDisabled = !this.fields.dims?.dut_name || this.isRunning || this.isUpdatingTopology;
  }

  private validate() {
    const isFieldsValid = checkSelectFields(this.fields);
    const isSuiteValid = this.suite !== '';
    return isFieldsValid && isSuiteValid;
  }
}
