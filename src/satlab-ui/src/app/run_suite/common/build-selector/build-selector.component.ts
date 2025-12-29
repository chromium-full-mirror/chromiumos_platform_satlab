import {
  ChangeDetectionStrategy,
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
import {
  BUILD_STATUS_MAPPINGS,
  SelectableItem,
} from 'app/models/selectable_item';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {
  BehaviorSubject,
  distinctUntilChanged,
  finalize,
  from,
  Subject,
  Subscription,
  tap,
} from 'rxjs';
import {BasicSelectorComponent} from '../basic-selector/basic-selector.component';
import {startWithTap} from 'app/utils/rxjs_operator';
import {toIterator} from 'app/utils/iterator';
import {NotificationService} from 'app/services/notification.service';
import {AsyncPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-build-selector',
  templateUrl: './build-selector.component.html',
  styleUrls: ['./build-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [BasicSelectorComponent, AsyncPipe, NgIf],
})
export class BuildSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() board: string;
  @Input() model: string;
  @Input() loading = new BehaviorSubject({show: false, message: ''});
  @Input() disabled = false;
  @Input() type: 'release' | 'firmware' | 'all' = 'release';

  @ViewChild('milestoneSelector') milestoneSelector?: BasicSelectorComponent;
  @ViewChild('buildSelector') buildSelector?: BasicSelectorComponent;

  @Output() onChanged = new EventEmitter<{
    milestone: string;
    build: string;
  }>();

  protected milestoneOptions: SelectableItem[] = [];
  protected buildOptions: SelectableItem[] = [];
  protected milestone$ = new BehaviorSubject<string>('');

  private init$ = new Subject<{board: string; model: string}>();
  private isFetchingMilestones = new BehaviorSubject<boolean>(false);
  private isFetchingBuilds = new BehaviorSubject<boolean>(false);
  private data: {milestone: string; build: string} = {milestone: '', build: ''};
  private build$ = new BehaviorSubject<string>('');
  private disposers: Subscription[] = [];

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.disposers = [
      this.init$
        .pipe(
          distinctUntilChanged((prev, cur) => {
            if (prev.board && prev.model) {
              return prev.board === cur.board && prev.model === cur.model;
            }

            return false;
          })
        )
        .subscribe({
          next: () => {
            this.getMilestones();
          },
        }),
      this.isFetchingMilestones.subscribe(e => {
        if (e) {
          this.showLoading(
            this.type === 'firmware'
              ? 'fetching firmware milestones...'
              : 'fetching milestones...'
          );
        } else {
          this.hideLoading();
        }
      }),
      this.isFetchingBuilds.subscribe(e => {
        if (e) {
          this.showLoading(
            this.type === 'firmware'
              ? 'fetching firmware builds...'
              : 'fetching builds...'
          );
        } else {
          this.hideLoading();
        }
      }),
      this.milestone$.pipe(distinctUntilChanged()).subscribe({
        next: newValue => {
          // clear the selected build because the milestone has been changed.
          this.data = {milestone: newValue, build: ''};

          // clear the build options and fetch the builds by new milestone.
          this.buildOptions = [];
          this.getBuilds();

          // notify the parent component.
          this.onChanged.emit(this.data);
        },
      }),
      this.build$.pipe(distinctUntilChanged()).subscribe({
        next: newValue => {
          // update the data.
          this.data = {...this.data, build: newValue};

          // notify the parent component.
          this.onChanged.emit(this.data);
        },
      }),
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    const isModelChanged =
      'model' in changes &&
      changes.model.previousValue !== changes.model.currentValue;
    const isBoardChanged =
      'board' in changes &&
      changes.board.previousValue !== changes.board.currentValue;
    if ('disabled' in changes) {
      this.disabled = changes.disabled.currentValue;
    }
    const disabled = this.disabled;

    if (disabled === false && this.milestoneOptions.length === 0) {
      this.init$.next({board: this.board, model: this.model});
    }

    if (isBoardChanged || isModelChanged) {
      this.clear();
      if (this.disabled === false) {
        const board =
          'board' in changes ? changes.board.currentValue : this.board;
        const model =
          'model' in changes ? changes.model.currentValue : this.model;
        this.init$.next({board: board, model: model});
      }
    }
  }

  ngOnDestroy(): void {
    this.disposers.forEach(d => d.unsubscribe());
  }

  protected onMilestoneChanged(newValue: string) {
    this.milestone$.next(newValue);
  }

  protected onBuildChanged(newValue: string) {
    this.build$.next(newValue);
  }

  private clear() {
    this.milestoneSelector?.clearSelection();
    this.buildSelector?.clearSelection();
    this.milestoneOptions = [];
    this.buildOptions = [];
    this.milestone$.next('');
    this.build$.next('');
  }

  private getMilestones() {
    if (this.board === '' || this.model === '') {
      return;
    }

    from(
      this.service.listMilestones(
        {board: this.board, model: this.model},
        this.type
      )
    )
      .pipe(
        startWithTap(() => {
          this.isFetchingMilestones.next(true);
        }),
        finalize(() => {
          this.isFetchingMilestones.next(false);
        }),
        tap(e => {
          this.milestoneOptions = toIterator(e)
            .map(e => e.getValue())
            .map(e => {
              const s: SelectableItem = {
                text: e,
                value: e,
                label: '',
              };
              return s;
            })
            .collect();
        })
      )
      .subscribe({
        error: e => {
          this.notification.error(
            `fetching firmware milestones failed. got an error: ${e}`,
            {dismiss: false}
          );
        },
      });
  }

  private getBuilds() {
    if (this.board === '' || this.model === '' || this.data.milestone === '') {
      return;
    }

    from(
      this.service.listBuilds(
        {board: this.board, model: this.model, milestone: this.data.milestone},
        this.type
      )
    )
      .pipe(
        startWithTap(() => {
          this.isFetchingBuilds.next(true);
        }),
        finalize(() => {
          this.isFetchingBuilds.next(false);
        }),
        tap(builds => {
          this.buildOptions = toIterator(builds)
            .map(e => {
              const status = BUILD_STATUS_MAPPINGS[e.getStatus()];
              const s: SelectableItem = {
                text: e.getValue(),
                value: e.getValue(),
                label: status,
              };
              return s;
            })
            .collect();
        })
      )
      .subscribe({
        error: e => {
          this.notification.error(
            `fetching firmware builds failed. got an error: ${e}`,
            {dismiss: false}
          );
        },
      });
  }

  // hide the loading.
  private hideLoading() {
    this.setLoading(false, '');
  }

  // show the loading with the message.
  private showLoading(message: string) {
    this.setLoading(true, message);
  }

  // change the loading status by given values.
  private setLoading(show: boolean, message: string) {
    this.loading.next({show: show, message: message});
  }
}
