import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {SatlabRpcService} from "../../services/satlab-rpc.service";
import {BasicSelectorComponent} from "../../run_suite/common/basic-selector/basic-selector.component";
import {
  BUILD_STATUS_MAPPINGS,
  BuildStatus,
  defaultBuildSelectFields,
  IBuildSelectFields,
  SelectableItem
} from "../../models/selectable_item";
import {finalize, from} from "rxjs";
import {toIterator} from "../../utils/iterator";
import {NotificationService} from "../../services/notification.service";
import {startWithTap} from "../../utils/rxjs_operator";
import {BUILD_ACCESS_REQUEST_URL} from "../../constants";

@Component({
  selector: 'app-stage-build',
  templateUrl: './stage-build.component.html',
  styleUrls: ['./stage-build.component.scss']
})
export class StageBuildComponent implements AfterViewInit {
  @ViewChild('boardSelector') boardSelector?: BasicSelectorComponent;
  @ViewChild('modelSelector') modelSelector?: BasicSelectorComponent;
  @ViewChild('milestoneSelector') milestoneSelector?: BasicSelectorComponent;
  @ViewChild('buildSelector') buildSelector?: BasicSelectorComponent;

  protected boardOptions: SelectableItem[] = [];
  protected modelOptions: SelectableItem[] = [];
  protected milestoneOptions: SelectableItem[] = [];
  protected buildOptions: SelectableItem[] = [];
  protected fields = defaultBuildSelectFields;

  // the object show the loading status and message
  protected loading = {
    show: false,
    message: '',
  };

  protected stageUrl = "";

  protected readonly build_access_request_link = BUILD_ACCESS_REQUEST_URL;

  constructor(private service: SatlabRpcService, private notification: NotificationService) {
  }

  ngAfterViewInit() {
    this.__getBoards();
  }

  /**
   * a handler handles `onBoardChanged` event.
   * @param newValue the new value of board
   * @protected
   */
  protected onBoardChanged(newValue: string) {
    this.fields = {
      ...defaultBuildSelectFields,
      board: newValue,
    };
    this.resetSelector(this.fields);
    this.__getModels();
  }

  protected onModelChanged(newValue: string) {
    this.fields = {
      ...this.fields,
      model: newValue,
      milestone: '',
      build: '',
    };
    this.resetSelector(this.fields);
    this.__getMilestones();
  }

  protected onMilestoneChanged(newValue: string) {
    this.fields = {
      ...this.fields,
      milestone: newValue,
      build: '',
    };
    this.resetSelector(this.fields);
    this.__getBuilds();
  }

  protected onBuildChanged(newValue: string) {
    this.fields = {
      ...this.fields,
      build: newValue,
    }
  }

  protected onStageClicked() {
    if (!this.__validate(this.fields)) {
      return;
    }
    this.__stageBuild();
  }

  /**
   * call an `get_boards` API to get all board options.
   * @private
   */
  private __getBoards() {
    from(this.service.listBoards())
      .pipe(startWithTap(() => {
        this.boardOptions = [];
        this.__showLoading('fetching boards...')
      }), finalize(() => {
        this.__hideLoading()
      }))
      .subscribe({
        next: boards => {
          this.boardOptions = toIterator(boards)
            .map(e => this.__toSelectableItem(e, e, ''))
            .collect();
        },
        error: e => {
          this.notification.error(`Fetching boards failed, got an error: ${JSON.stringify(e)}`, {dismiss: false})
        }
      })
  }

  /**
   * call an `get_models` API to get all model options.
   * @private
   */
  private __getModels() {
    if (this.fields.board === '') {
      return;
    }
    from(this.service.listModels(this.fields.board))
      .pipe(startWithTap(() => {
        this.modelOptions = [];
        this.__showLoading('fetching models...')
      }), finalize(() => {
        this.__hideLoading()
      }))
      .subscribe({
        next: models => {
          this.modelOptions = toIterator(models)
            .map(e => this.__toSelectableItem(e, e, ''))
            .collect();
        },
        error: e => this.notification.error(`Fetching models got an error: ${JSON.stringify(e)}`, {dismiss: false})
      })
  }

  /**
   * call an API to get milestones
   * @private
   */
  private __getMilestones() {
    if (this.fields.model !== '' && this.fields.board !== '') {
      from(this.service.listMilestones({...this.fields}))
        .pipe(
          startWithTap(() => {
            this.milestoneOptions = [];
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
          error: e => this.notification.error(`Fetching milestones got an error: ${e}`, {dismiss: false}),
        });
    }
  }

  /**
   * call an API to get build versions.
   * @private
   */
  private __getBuilds() {
    if (
      this.fields.model !== '' &&
      this.fields.board !== '' &&
      this.fields.milestone !== ''
    ) {
      from(this.service.listBuilds({...this.fields,}))
        .pipe(
          startWithTap(() => {
            this.buildOptions = [];
            this.__showLoading('fetching builds...')
          }),
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
          error: e => this.notification.error(`Fetching builds got an error: ${e}`, {dismiss: false}),
        });
    }
  }

  private __stageBuild() {
    from(this.service.stageBuild(this.fields))
      .pipe(
        startWithTap(() => {
          this.__showLoading('staging build...')
        }),
        finalize(() => this.__hideLoading())
      ).subscribe({
      next: e => {
        this.stageUrl = `https://console.cloud.google.com/storage/browser/${e}/${this.fields.board}-release/R${this.fields.milestone}-${this.fields.build}/`;
      },
      error: e => this.notification.error(`stage build failed, got an error: ${JSON.stringify(e)}`, {dismiss: false}),
    })
  }

  /**
   * reset the selection.
   * @param fields
   * @private
   */
  private resetSelector(fields: IBuildSelectFields) {
    if (fields.model === '') {
      this.modelSelector?.clearSelection();
    }
    if (fields.milestone === '') {
      this.milestoneSelector?.clearSelection();
    }
    if (fields.build === '') {
      this.buildSelector?.clearSelection();
    }
  }

  /**
   * convert a string to select options.
   * @private
   * @param text
   * @param value
   * @param label
   */
  private __toSelectableItem(text: string, value: string, label: BuildStatus): SelectableItem {
    return {
      text: text,
      value: value,
      label: label,
    };
  }

  private __validate(fields: IBuildSelectFields) {
    return fields.board !== '' && fields.model !== '' && fields.milestone !== '' && fields.build !== ''
  }

  private __showLoading(message: string) {
    this.loading = {show: true, message: message};
  }

  private __hideLoading() {
    this.loading = {show: false, message: ''};
  }
}
