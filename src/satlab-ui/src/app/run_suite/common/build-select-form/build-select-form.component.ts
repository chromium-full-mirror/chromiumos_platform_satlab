import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {IDut, ISimpleDUT} from '../../../models/dut';
import {BuildStatus, SelectableItem} from '../../../models/selectable_item';
import {SatlabRpcService} from '../../../services/satlab-rpc.service';
import {toIterator} from '../../../utils/iterator';
import {BehaviorSubject, finalize, from, Subject, Subscription} from 'rxjs';
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
  implements AfterViewInit, OnDestroy, OnChanges, OnInit
{
  @Input() hidePoolSelector = false;
  @Input() hideHostnameSelector = true;
  @Input() loading = new BehaviorSubject<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  @Output() allRequiredFieldsSet = new EventEmitter<IBuildSelectFields>();
  @Output() onInitComplete = new EventEmitter<{duts: ISimpleDUT[]}>();

  @ViewChild('boardSelector') boardSelector?: BasicSelectorComponent;
  @ViewChild('poolSelector') poolSelector?: BasicSelectorComponent;
  @ViewChild('hostnameSelector') hostnameSelector?: BasicSelectorComponent;

  protected modelOptions: SelectableItem[] = [];
  protected boardOptions: SelectableItem[] = [];
  protected poolOptions: SelectableItem[] = [];
  protected hostnameOptions: SelectableItem[] = [];
  protected fields = defaultBuildSelectFields;
  protected loading$ = this.loading.asObservable();
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

  ngOnChanges(changes: SimpleChanges): void {
    const isLoadingChanged =
      'loading' in changes &&
      changes.loading.currentValue !== changes.loading.previousValue;
    if (isLoadingChanged) {
      this.loading$ = changes.loading.currentValue.asObservable();
    }
  }

  ngOnDestroy() {
    this.disposer?.unsubscribe();
  }

  public showLoading(message: string) {
    this.loading.next({show: true, message: message});
  }

  public hideLoading() {
    this.loading.next({show: false, message: ''});
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

  protected onBuildChanged(newValue: {milestone: string; build: string}) {
    this.fields = {
      ...this.fields,
      ...newValue,
    };
    this.fields$.next(this.fields);
  }

  #parseAPIResponse(duts: IDut[]): void {
    this.duts = duts
      .filter(e => !e.hasAndroidDesktopImage)
      .map(e => {
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
    if (fields.pool === '') {
      this.poolSelector?.clearSelection();
    }
    if (!fields.dims) {
      this.hostnameSelector?.clearSelection();
    }
  }
}
