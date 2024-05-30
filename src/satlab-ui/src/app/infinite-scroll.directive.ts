import {Directive, EventEmitter, HostListener, Output} from '@angular/core';
import * as rxjs from 'rxjs';

@Directive({
  selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective {
  @Output()
  scrollCallback: EventEmitter<unknown> = new EventEmitter();
  private source = new rxjs.Subject<unknown>();
  private ngDestroy$ = new rxjs.Subject<void>();

  constructor() {
    this.source
      .pipe(rxjs.debounceTime(200), rxjs.takeUntil(this.ngDestroy$))
      .subscribe(this.scrollCallback);
  }

  ngOnDestroy(): void {
    this.ngDestroy$.next();
    this.ngDestroy$.complete();
  }

  @HostListener('scroll', ['$event']) onScroll = (event: unknown) => {
    this.source.next(event);
  };
}
