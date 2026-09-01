import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {OSType, OS_LABEL_MAP} from 'app/models/os';
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

const DEFAULT_DATA: {
  board: string;
  model: string;
  os: OSType;
  osImage: string;
  fwVersion: string;
  fwImage: string;
} = {
  board: '',
  model: '',
  os: 'chromeos',
  osImage: '',
  fwVersion: '',
  fwImage: '',
};

@Component({
    selector: 'app-stable-version-card',
    templateUrl: './stable-version-card.component.html',
    styleUrls: ['./stable-version-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class StableVersionCardComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() board = '';
  @Input() model = '';
  @Input() os: OSType = 'chromeos';
  @Input() filterOS: OSType | null = null;

  // isFwImageTruncated determines if the value of fwImage is Truncated.
  protected isFwImageTruncated: boolean = false;
  // isFwVersionTruncated determines if the value of fwVersion is Truncated.
  protected isFwVersionTruncated: boolean = false;

  handleFwImageEllipsisState(isTruncated: boolean): void {
    this.isFwImageTruncated = isTruncated;
  }

  handleVersionEllipsisState(isTruncated: boolean): void {
    this.isFwVersionTruncated = isTruncated;
  }

  protected loading = false;
  protected data$ = new BehaviorSubject<{
    board: string;
    model: string;
    os: OSType;
    osImage: string;
    fwVersion: string;
    fwImage: string;
  }>(DEFAULT_DATA);
  protected isError = false;

  private disposers: Subscription[] = [];

  protected OSLabel = OS_LABEL_MAP;

  constructor(private service: SatlabRpcService) {}

  ngOnInit(): void {
    this.disposers = [
      this.data$
        .pipe(
          distinctUntilChanged(
            (prev, curr) =>
              prev.board === curr.board &&
              prev.model === curr.model &&
              prev.os === curr.os
          ),
          switchMap(req => {
            return this.service
              .getStableVersion({...req, isDesktop: this.os === 'android'})
              .pipe(
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
            this.data$.next({
              ...resp,
              os: this.os,
            });
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
    const isOSChanged =
      'os' in changes && changes.os.currentValue !== changes.os.previousValue;

    if (isBoardChanged) {
      this.data$.next({...this.data$.value, board: changes.board.currentValue});
    }

    if (isModelChanged) {
      this.data$.next({...this.data$.value, model: changes.model.currentValue});
    }

    if (isOSChanged) {
      this.data$.next({
        ...this.data$.value,
        os: changes.os.currentValue,
      });
    }
  }
}
