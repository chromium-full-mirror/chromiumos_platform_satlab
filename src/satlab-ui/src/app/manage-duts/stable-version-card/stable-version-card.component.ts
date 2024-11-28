import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {startWithTap} from 'app/utils/rxjs_operator';
import {
  BehaviorSubject,
  Subscription,
  catchError,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
  tap,
} from 'rxjs';

const DEFAULT_DATA = {
  board: '',
  model: '',
  osImage: '',
  fwVersion: '',
  fwImage: '',
};

@Component({
  selector: 'app-stable-version-card',
  templateUrl: './stable-version-card.component.html',
  styleUrls: ['./stable-version-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StableVersionCardComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() board = '';
  @Input() model = '';

  protected loading = false;
  protected data$ = new BehaviorSubject<{
    board: string;
    model: string;
    osImage: string;
    fwVersion: string;
    fwImage: string;
  }>(DEFAULT_DATA);
  protected isError = false;

  private disposers: Subscription[] = [];

  constructor(private service: SatlabRpcService) {}

  ngOnInit(): void {
    this.disposers = [
      this.data$
        .pipe(
          distinctUntilChanged(
            (prev, curr) =>
              prev.board === curr.board && prev.model === curr.model
          ),
          switchMap(req => {
            return this.service.getStableVersion({...req}).pipe(
              startWithTap(() => {
                this.isError = false;
                this.loading = true;
              }),
              finalize(() => {
                this.loading = false;
              }),
              catchError(err => {
                console.error(err);
                this.isError = true;
                return of({
                  ...DEFAULT_DATA,
                  board: this.board,
                  model: this.model,
                });
              })
            );
          }),
          tap(resp => {
            this.data$.next(resp);
          })
        )
        .subscribe(),
    ];
  }

  ngOnDestroy(): void {
    this.disposers.forEach(d => d.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    const isBoardChanged =
      'board' in changes &&
      changes.board.currentValue !== changes.board.previousValue;
    const isModelChanged =
      'model' in changes &&
      changes.model.currentValue !== changes.model.previousValue;

    if (isBoardChanged) {
      this.data$.next({...this.data$.value, board: changes.board.currentValue});
    }

    if (isModelChanged) {
      this.data$.next({...this.data$.value, model: changes.model.currentValue});
    }
  }
}
