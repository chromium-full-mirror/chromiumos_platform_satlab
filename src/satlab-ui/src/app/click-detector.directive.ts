import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appClickDetector]',
})
export class ClickDetectorDirective {
  @Output() outside = new EventEmitter<PointerEvent>();
  @Output() inside = new EventEmitter<PointerEvent>();

  constructor(private eRef: ElementRef) {}

  @HostListener('document:click', ['$event']) click(e: PointerEvent) {
    e.stopPropagation();
    if (this.eRef.nativeElement.contains(e.target)) {
      this.inside.emit(e);
    } else {
      this.outside.emit(e);
    }
  }
}
