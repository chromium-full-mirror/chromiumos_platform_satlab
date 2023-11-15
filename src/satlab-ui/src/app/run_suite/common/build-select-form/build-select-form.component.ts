import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {ISimpleDUT} from '../../../models/dut';
import {
  BUILD_STATUS_MAPPINGS,
  BuildStatus,
  defaultBuildSelectFields,
  IBuildSelectFields,
  SelectableItem,
} from '../../../models/selectable_item';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {Dut} from '../../../services/satlabrpc_pb';
import {toIterator} from '../../../utils/iterator';
import {finalize, from, Subject, Subscription} from 'rxjs';
import {startWithTap} from '../../../utils/rxjs_operator';
import {BasicSelectorComponent} from '../basic-selector/basic-selector.component';
import {NotificationService} from '../../../services/notification.service';

@Component({
  selector: 'app-build-select-form',
  templateUrl: './build-select-form.component.html',
  styleUrls: ['./build-select-form.component.scss'],
})
export class BuildSelectFormComponent
  implements AfterViewInit, OnDestroy, OnInit {
  @Output() allRequiredFieldsSet = new EventEmitter<IBuildSelectFields>();
  @Output() onInitComplete = new EventEmitter();

  @ViewChild('boardSelector') boardSelector?: BasicSelectorComponent;
  @ViewChild('milestoneSelector') milestoneSelector?: BasicSelectorComponent;
  @ViewChild('buildSelector') buildSelector?: BasicSelectorComponent;
  @ViewChild('poolSelector') poolSelector?: BasicSelectorComponent;
  protected modelOptions: SelectableItem[] = [];
  protected boardOptions: SelectableItem[] = [];
  protected poolOptions: SelectableItem[] = [];
  protected milestoneOptions: SelectableItem[] = [];
  protected buildOptions: SelectableItem[] = [];
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
  ) {
  }

  ngOnInit() {
    this.disposer = this.fields$
      .subscribe(e => this.allRequiredFieldsSet.emit(e));
  }

  ngAfterViewInit() {
    from(this.service.listEnrolledDUTs())
      .pipe(
        startWithTap(() => this.showLoading('fetching models...')),
        finalize(() => {
          this.hideLoading();
          this.onInitComplete.emit();
        })
      )
      .subscribe({
        next: duts => this.parseAPIResponse(duts),
        error: e => {
          this.notification.error(`Fetching model got an error: ${e}`, {dismiss: false})
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
    this.resetSelector(this.fields);
    this.fields$.next(this.fields);
    this.poolOptions = [];
    this.parseBoardOptionsFromDUTs(this.duts);
  }

  protected onBoardChanged(newBoard: string) {
    this.fields = {
      ...this.fields,
      board: newBoard,
      milestone: '',
      build: '',
      pool: '',
    };
    this.resetSelector(this.fields);
    this.fields$.next(this.fields);
    this.parsePoolOptionsFromDUTs(this.duts);
    this.getMilestones();
  }

  protected onMilestoneChanged(newMilestone: string) {
    this.fields = {
      ...this.fields,
      milestone: newMilestone,
      build: '',
    };
    this.resetSelector(this.fields);
    this.fields$.next(this.fields);
    this.getBuilds();
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

  private parseAPIResponse(duts: Dut[]): void {
    this.duts = duts.map(e => {
      const dut: ISimpleDUT = {
        model: e.getModel(),
        board: e.getBoard(),
        pools: e.getPoolsList(),
      };
      return dut;
    });

    this.parseModelOptionsFromDUTs(this.duts);
  }

  private parseModelOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.modelOptions = toIterator(duts)
      .map(e => e.model)
      .unique_by()
      .map(e => this.toSelectableItem(e, e, ''))
      .collect();
  }

  private parseBoardOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.boardOptions = [];
    if (this.fields.model !== '') {
      this.boardOptions = toIterator(duts)
        .filter(d => d.model === this.fields.model)
        .map(e => e.board)
        .unique_by()
        .map(e => this.toSelectableItem(e, e, ''))
        .collect();
    }
  }

  private parsePoolOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.poolOptions = [];
    if (this.fields.model !== '' && this.fields.board !== '') {
      this.poolOptions = toIterator(duts)
        .filter(
          d => d.model === this.fields.model && d.board === this.fields.board
        )
        .map(e => e.pools)
        .flatten()
        .unique_by()
        .map(e => this.toSelectableItem(e, e, ''))
        .collect();
    }
  }

  private getMilestones() {
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
              .map(e => this.toSelectableItem(e, e, ''))
              .collect();
          },
          error: e => {
            this.notification.error(`Fetching milestones got an error: ${e}`, {dismiss: false})
          },
        });
    }
  }

  private getBuilds() {
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
                return this.toSelectableItem(
                  e.getValue(),
                  e.getValue(),
                  status
                );
              })
              .collect();
          },
          error: e => {
            this.notification.error(`Fetching builds got an error: ${e}`, {dismiss: false})
          },
        });
    }
  }

  private toSelectableItem(
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

  private resetSelector(fields: IBuildSelectFields) {
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
  }
}
