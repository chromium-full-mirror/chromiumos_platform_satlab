import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
} from '@angular/core';

@Directive({
    selector: '[appSingleLineEllipsis]',
    standalone: false
})
export class SingleLineEllipsisDirective implements AfterViewInit, OnDestroy {
  @Output() isEllipsis = new EventEmitter<boolean>();
  private observer?: ResizeObserver;

  constructor(
    private el: ElementRef,
    private zone: NgZone
  ) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.observer = new ResizeObserver(() => this.check());
      this.observer.observe(this.el.nativeElement);
    });

    setTimeout(() => this.check());
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private check() {
    const el = this.el.nativeElement as HTMLElement;
    const truncated = el.scrollWidth > el.clientWidth;

    this.zone.run(() => {
      this.isEllipsis.emit(truncated);
    });
  }
}
