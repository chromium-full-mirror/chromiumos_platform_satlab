import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {IDut, ISimpleDUT} from '../../../models/dut';
import {
  BUILD_STATUS_MAPPINGS,
  BuildStatus,
  SelectableItem,
} from '../../../models/selectable_item';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {toIterator} from '../../../utils/iterator';
import {finalize, from, Subject, Subscription} from 'rxjs';
import {startWithTap} from '../../../utils/rxjs_operator';
import {BasicSelectorComponent} from '../basic-selector/basic-selector.component';
import {NotificationService} from '../../../services/notification.service';
import {
  defaultBuildSelectFields,
  IBuildSelectFields,
} from '../../../models/run_suite_fields';
import {labelDlmSkuID} from 'app/models/dims';

@Component({
  selector: 'app-build-select-form',
  templateUrl: './build-select-form.component.html',
  styleUrls: ['./build-select-form.component.scss'],
})
export class BuildSelectFormComponent
  implements AfterViewInit, OnDestroy, OnInit
{
  @Input() hidePoolSelector = false;
  @Input() hideHostnameSelector = true;

  @Output() allRequiredFieldsSet = new EventEmitter<IBuildSelectFields>();
  @Output() onInitComplete = new EventEmitter<{duts: ISimpleDUT[]}>();

  @ViewChild('boardSelector') boardSelector?: BasicSelectorComponent;
  @ViewChild('milestoneSelector') milestoneSelector?: BasicSelectorComponent;
  @ViewChild('buildSelector') buildSelector?: BasicSelectorComponent;
  @ViewChild('poolSelector') poolSelector?: BasicSelectorComponent;
  @ViewChild('hostnameSelector') hostnameSelector?: BasicSelectorComponent;

  protected modelOptions: SelectableItem[] = [];
  protected boardOptions: SelectableItem[] = [];
  protected poolOptions: SelectableItem[] = [];
  protected milestoneOptions: SelectableItem[] = [];
  protected buildOptions: SelectableItem[] = [];
  protected hostnameOptions: SelectableItem[] = [];
  protected fields = defaultBuildSelectFields;
  protected loading = {
    show: false,
    message: '',
  };
  private duts: ISimpleDUT[] = [];
  private fields$ = new Subject<IBuildSelectFields>();
  private disposer?: Subscription;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.disposer = this.fields$.subscribe(e =>
      this.allRequiredFieldsSet.emit(e)
    );
  }

  ngAfterViewInit() {
    from(this.service.listEnrolledDUTs())
      .pipe(
        startWithTap(() => this.showLoading('fetching models...')),
        finalize(() => {
          this.hideLoading();
          this.onInitComplete.emit({duts: this.duts});
        })
      )
      .subscribe({
        next: duts => this.#parseAPIResponse(duts),
        error: e => {
          this.notification.error(`Fetching model got an error: ${e}`, {
            dismiss: false,
          });
        },
      });
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  public showLoading(message: string) {
    this.loading = {show: true, message: message};
  }

  public hideLoading() {
    this.loading = {show: false, message: ''};
  }

  protected onModelChanged(newModel: string) {
    this.fields = {
      model: newModel,
      board: '',
      milestone: '',
      build: '',
      pool: '',
    };
    this.#resetSelector(this.fields);
    this.fields$.next(this.fields);
    this.poolOptions = [];
    this.#parseBoardOptionsFromDUTs(this.duts);
  }

  protected onBoardChanged(newBoard: string) {
    this.fields = {
      ...this.fields,
      board: newBoard,
      milestone: '',
      build: '',
      pool: '',
    };
    this.#resetSelector(this.fields);
    this.fields$.next(this.fields);
    this.#parsePoolOptionsFromDUTs(this.duts);
    this.#parseHostnameOptionsFromDUTs(this.duts);
    this.#getMilestones();
  }

  protected onMilestoneChanged(newMilestone: string) {
    this.fields = {
      ...this.fields,
      milestone: newMilestone,
      build: '',
    };
    this.#resetSelector(this.fields);
    this.fields$.next(this.fields);
    this.#getBuilds();
  }

  protected onBuildChanged(newBuild: string) {
    this.fields = {
      ...this.fields,
      build: newBuild,
    };
    this.fields$.next(this.fields);
  }

  protected onPoolChanged(newPool: string) {
    this.fields = {
      ...this.fields,
      pool: newPool,
    };
    this.fields$.next(this.fields);
  }

  protected onHostnameChanged(newHostname: string) {
    const pool = this.duts.find(e => e.hostname === newHostname);
    if (!pool && pool.pools.length > 0) {
      return;
    }

    this.fields = {
      ...this.fields,
      pool: pool.pools[0],
      dims: {
        dut_name: newHostname,
      },
    };
    this.fields$.next(this.fields);
  }

  #parseAPIResponse(duts: IDut[]): void {
    this.duts = duts.map(e => {
      const dut: ISimpleDUT = {
        hostname: e.hostname,
        model: e.model,
        board: e.board,
        pools: e.pools,
        dlmSkuID:
          (e.dimensions[labelDlmSkuID]?.length ?? 0) > 0
            ? e.dimensions[labelDlmSkuID][0]
            : '',
      };
      return dut;
    });

    this.#parseModelOptionsFromDUTs(this.duts);
  }

  #parseModelOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.modelOptions = toIterator(duts)
      .map(e => e.model)
      .unique_by()
      .map(e => this.#toSelectableItem(e, e, ''))
      .collect();
  }

  #parseBoardOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.boardOptions = [];
    if (this.fields.model !== '') {
      this.boardOptions = toIterator(duts)
        .filter(d => d.model === this.fields.model)
        .map(e => e.board)
        .unique_by()
        .map(e => this.#toSelectableItem(e, e, ''))
        .collect();
    }
  }

  #parsePoolOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.poolOptions = [];
    if (this.fields.model !== '' && this.fields.board !== '') {
      this.poolOptions = toIterator(duts)
        .filter(
          d => d.model === this.fields.model && d.board === this.fields.board
        )
        .map(e => e.pools)
        .flatten()
        .unique_by()
        .map(e => this.#toSelectableItem(e, e, ''))
        .collect();
    }
  }

  #parseHostnameOptionsFromDUTs(duts: ISimpleDUT[]) {
    this.hostnameOptions = [];
    if (this.fields.model !== '' && this.fields.board !== '') {
      this.hostnameOptions = toIterator(duts)
        .filter(
          d => d.model === this.fields.model && d.board === this.fields.board
        )
        .map(e => e.hostname)
        .unique_by()
        .map(e => this.#toSelectableItem(e, e, ''))
        .collect();
    }
  }

  #getMilestones() {
    if (this.fields.model !== '' && this.fields.board !== '') {
      from(this.service.listMilestones({...this.fields}))
        .pipe(
          startWithTap(() => {
            this.milestoneOptions = [];
            this.buildOptions = [];
            this.showLoading('fetching milestones...');
          }),
          finalize(() => this.hideLoading())
        )
        .subscribe({
          next: milestones => {
            this.milestoneOptions = toIterator(milestones)
              .map(e => e.getValue())
              .map(e => this.#toSelectableItem(e, e, ''))
              .collect();
          },
          error: e => {
            this.notification.error(`Fetching milestones got an error: ${e}`, {
              dismiss: false,
            });
          },
        });
    }
  }

  #getBuilds() {
    if (
      this.fields.model !== '' &&
      this.fields.board !== '' &&
      this.fields.milestone !== ''
    ) {
      from(
        this.service.listBuilds({
          ...this.fields,
        })
      )
        .pipe(
          startWithTap(() => this.showLoading('fetching builds...')),
          finalize(() => this.hideLoading())
        )
        .subscribe({
          next: builds => {
            this.buildOptions = toIterator(builds)
              .map(e => {
                const status = BUILD_STATUS_MAPPINGS[e.getStatus()];
                return this.#toSelectableItem(
                  e.getValue(),
                  e.getValue(),
                  status
                );
              })
              .collect();
          },
          error: e => {
            this.notification.error(`Fetching builds got an error: ${e}`, {
              dismiss: false,
            });
          },
        });
    }
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

  #resetSelector(fields: IBuildSelectFields) {
    if (fields.board === '') {
      this.boardSelector?.clearSelection();
    }
    if (fields.milestone === '') {
      this.milestoneSelector?.clearSelection();
    }
    if (fields.build === '') {
      this.buildSelector?.clearSelection();
    }
    if (fields.pool === '') {
      this.poolSelector?.clearSelection();
    }
    if (!fields.dims) {
      this.hostnameSelector?.clearSelection();
    }
  }
}
