import {
  AfterViewInit,
  Component,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {BasicSelectorComponent} from '../../run_suite/common/basic-selector/basic-selector.component';
import {
  BUILD_STATUS_MAPPINGS,
  BuildStatus,
  SelectableItem,
} from '../../models/selectable_item';
import {BehaviorSubject, finalize, from} from 'rxjs';
import {toIterator} from '../../utils/iterator';
import {NotificationService} from '../../services/notification.service';
import {startWithTap} from '../../utils/rxjs_operator';
import {BUILD_ACCESS_REQUEST_URL} from '../../constants';
import {
  defaultBuildSelectFields,
  IBuildSelectFields,
} from '../../models/run_suite_fields';

@Component({
  selector: 'app-stage-build',
  templateUrl: './stage-build.component.html',
  styleUrls: ['./stage-build.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class StageBuildComponent implements AfterViewInit {
  @ViewChild('boardSelector') boardSelector?: BasicSelectorComponent;
  @ViewChild('modelSelector') modelSelector?: BasicSelectorComponent;

  protected boardOptions: SelectableItem[] = [];
  protected modelOptions: SelectableItem[] = [];
  protected fields = {...defaultBuildSelectFields};

  // the object show the loading status and message
  protected stageUrl = '';

  protected readonly build_access_request_link = BUILD_ACCESS_REQUEST_URL;

  protected loading = new BehaviorSubject<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = this.loading.asObservable();

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

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
  }

  protected onBuildChanged(newValue: {milestone: string; build: string}) {
    this.fields = {
      ...this.fields,
      ...newValue,
    };
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
      .pipe(
        startWithTap(() => {
          this.boardOptions = [];
          this.__showLoading('fetching boards...');
        }),
        finalize(() => {
          this.__hideLoading();
        })
      )
      .subscribe({
        next: boards => {
          this.boardOptions = toIterator(boards)
            .map(e => this.__toSelectableItem(e, e, ''))
            .collect();
        },
        error: e => {
          this.notification.error(
            `Fetching boards failed, got an error: ${JSON.stringify(e)}`,
            {dismiss: false}
          );
        },
      });
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
      .pipe(
        startWithTap(() => {
          this.modelOptions = [];
          this.__showLoading('fetching models...');
        }),
        finalize(() => {
          this.__hideLoading();
        })
      )
      .subscribe({
        next: models => {
          this.modelOptions = toIterator(models)
            .map(e => this.__toSelectableItem(e, e, ''))
            .collect();
        },
        error: e =>
          this.notification.error(
            `Fetching models got an error: ${JSON.stringify(e)}`,
            {dismiss: false}
          ),
      });
  }

  private __stageBuild() {
    this.service
      .stageBuild(this.fields)
      .pipe(
        startWithTap(() => {
          this.__showLoading('staging build...');
        }),
        finalize(() => this.__hideLoading())
      )
      .subscribe({
        next: e => {
          this.stageUrl = `https://console.cloud.google.com/storage/browser/${e.bucket}/${e.path}`;
        },
        error: e =>
          this.notification.error(
            `stage build failed, got an error: ${JSON.stringify(e)}`,
            {dismiss: false}
          ),
      });
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
  }

  /**
   * convert a string to select options.
   * @private
   * @param text
   * @param value
   * @param label
   */
  private __toSelectableItem(
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

  private __validate(fields: IBuildSelectFields) {
    return (
      fields.board !== '' &&
      fields.model !== '' &&
      fields.milestone !== '' &&
      fields.build !== ''
    );
  }

  private __showLoading(message: string) {
    this.loading.next({show: true, message: message});
  }

  private __hideLoading() {
    this.loading.next({show: false, message: ''});
  }
}
