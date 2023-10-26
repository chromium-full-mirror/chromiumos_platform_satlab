import {Component, Inject, ViewChild} from '@angular/core';
import {BasicSelectorComponent} from "../../run_suite/common/basic-selector/basic-selector.component";
import {
  BUILD_STATUS_MAPPINGS,
  BuildStatus,
  defaultBuildSelectFields,
  IBuildSelectFields,
  SelectableItem
} from "../../models/selectable_item";
import {ISimpleDUT} from "../../models/dut";
import {SatlabRpcService} from "../../services/satlab-rpc.service";
import {finalize, from} from "rxjs";
import {startWithTap} from "../../utils/rxjs_operator";
import {toIterator} from "../../utils/iterator";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

@Component({
  selector: 'app-provision',
  templateUrl: './provision.component.html',
  styleUrls: ['./provision.component.scss']
})
export class ProvisionComponent {
  @ViewChild('milestoneSelector') milestoneSelector?: BasicSelectorComponent;
  @ViewChild('buildSelector') buildSelector?: BasicSelectorComponent;
  @ViewChild('poolSelector') poolSelector?: BasicSelectorComponent;

  protected poolOptions: SelectableItem[] = [];
  protected milestoneOptions: SelectableItem[] = [];
  protected buildOptions: SelectableItem[] = [];

  private readonly duts: ISimpleDUT[] = [];

  protected loading = {
    show: false,
    message: '',
  };

  public fields = defaultBuildSelectFields;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { duts: ISimpleDUT[] },
    private service: SatlabRpcService
  ) {
    this.duts = data.duts;
    this.__parsePoolOptionsFromDUTs(data.duts);
  }


  /**
   * onPoolChanged an event handler handles on pool changed.
   * @param newPool
   * @protected
   */
  protected onPoolChanged(newPool: string) {
    const d = toIterator(this.duts)
      .first_where(e => e.pools.includes(newPool))

    if (d == null) {
      console.error(`unexpected: ${JSON.stringify(this.duts)}, pools: ${newPool}`);
      return;
    }

    this.fields = {
      model: d.model,
      board: d.board,
      pool: newPool,
      milestone: '',
      build: ''
    };
    this.__resetSelector(this.fields);
    this.__getMilestones();
  }

  /**
   * onMilestoneChanged an event handler handles on milestone changed.
   * @param newMilestone
   * @protected
   */
  protected onMilestoneChanged(newMilestone: string) {
    this.fields = {
      ...this.fields,
      milestone: newMilestone,
      build: '',
    };
    this.__resetSelector(this.fields);
    this.__getBuilds();
  }

  /**
   * onBuildChanged an event handler handles on board changed
   * @param newBuild
   * @protected
   */
  protected onBuildChanged(newBuild: string) {
    this.fields = {
      ...this.fields,
      build: newBuild,
    };
  }

  /**
   * __geMilestones call an `list_milestones` API to fetch the milestones.
   * @private
   */
  private __getMilestones() {
    if (this.fields.model !== '' && this.fields.board !== '') {
      from(this.service.listMilestones({...this.fields}))
        .pipe(
          startWithTap(() => {
            this.milestoneOptions = [];
            this.buildOptions = [];
            this.__showLoading('fetching milestones...');
          }),
          finalize(() => this.__hideLoading())
        )
        .subscribe({
          next: milestones => {
            this.milestoneOptions = toIterator(milestones)
              .map(e => e.getValue())
              .map(e => this.__toSelectableItem(e, e, ''))
              .collect();
          },
          error: e => {
            //TODO: handle error
            console.log(`fetching milestones got an error: ${e}`);
          },
        });
    }
  }

  /**
   * __getBuilds call an `list_builds` API to fetch build versions.
   * @private
   */
  private __getBuilds() {
    if (this.fields.model !== '' && this.fields.board !== '' && this.fields.milestone !== '') {
      from(
        this.service.listBuilds({
          ...this.fields,
        })
      )
        .pipe(
          startWithTap(() => this.__showLoading('fetching builds...')),
          finalize(() => this.__hideLoading())
        )
        .subscribe({
          next: builds => {
            this.buildOptions = toIterator(builds)
              .map(e => {
                const status = BUILD_STATUS_MAPPINGS[e.getStatus()];
                return this.__toSelectableItem(
                  e.getValue(),
                  e.getValue(),
                  status
                );
              })
              .collect();
          },
          error: e => {
            //TODO: handle error
            console.log(`fetching builds got an error: ${e}`);
          },
        });
    }
  }

  /**
   * __resetSelector reset the user selection.
   * @param fields
   * @private
   */
  private __resetSelector(fields: IBuildSelectFields) {
    if (fields.milestone === '') {
      this.milestoneSelector?.clearSelection();
    }
    if (fields.build === '') {
      this.buildSelector?.clearSelection();
    }
  }

  /**
   * __toSelectableItem changes the value to selectable item to option.
   * @param text
   * @param value
   * @param label
   * @private
   */
  private __toSelectableItem(text: string, value: string, label: BuildStatus): SelectableItem {
    return {
      text: text,
      value: value,
      label: label,
    };
  }

  /**
   * __parsePoolOptionsFromDUTs fetch all pools from DUTs
   * @param duts the simple information of DUT that contains model, board, and pool.
   * @private
   */
  private __parsePoolOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.poolOptions = [];
    this.poolOptions = toIterator(duts)
      .map(e => e.pools)
      .flatten()
      .unique_by()
      .map(e => this.__toSelectableItem(e, e, ''))
      .collect();
  }

  /**
   * __showLoading show the loading indicator and message.
   * call this function when we want to call any API.
   * @param message
   * @private
   */
  private __showLoading(message: string) {
    this.loading = {show: true, message: message};
  }

  /**
   * __hideLoading hide the loading indicator and message.
   * call this function when we call an API finished
   * @private
   */
  private __hideLoading() {
    this.loading = {show: false, message: ''};
  }
}
