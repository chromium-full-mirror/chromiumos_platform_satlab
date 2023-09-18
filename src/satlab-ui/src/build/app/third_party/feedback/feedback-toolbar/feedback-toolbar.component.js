var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { fromEvent as observableFromEvent } from 'rxjs';
import { takeUntil, finalize, map, mergeMap, skipUntil } from 'rxjs/operators';
import { Component, ElementRef, Input, Output, EventEmitter, ViewChild, } from '@angular/core';
import { FeedbackService } from '../feedback.service';
let FeedbackToolbarComponent = class FeedbackToolbarComponent {
    constructor(el, feedbackService) {
        this.el = el;
        this.feedbackService = feedbackService;
        this.manipulate = new EventEmitter();
        this.disableToolbarTips = false;
        this.isSwitch = false;
        this.isDragging = false;
        this.vars = {};
        this.vars = feedbackService.initialVariables;
    }
    ngAfterViewInit() {
        const elStyle = this.el.nativeElement.style;
        elStyle.position = 'absolute';
        elStyle.left = '43%';
        elStyle.top = '60%';
        this.addDragListenerOnMoveBtn();
    }
    ngOnChanges() {
        this.isSwitch = this.drawColor !== this.feedbackService.highlightedColor;
    }
    done() {
        this.manipulate.emit('done');
    }
    toggleHighlight() {
        this.isSwitch = false;
        this.manipulate.emit(this.feedbackService.highlightedColor);
    }
    toggleHide() {
        this.isSwitch = true;
        this.manipulate.emit(this.feedbackService.hiddenColor);
    }
    addDragListenerOnMoveBtn() {
        const mouseDown$ = observableFromEvent(this.toggleMoveBtn.nativeElement, 'mousedown');
        const mouseUp$ = observableFromEvent(this.toggleMoveBtn.nativeElement, 'mouseup');
        const mouseMove$ = observableFromEvent(this.toggleMoveBtn.nativeElement, 'mousemove');
        //Mouse drag event
        const mouseDragging$ = mouseMove$.pipe(skipUntil(mouseDown$), takeUntil(mouseUp$));
        const move$ = mouseDragging$.pipe(mergeMap((md, index) => {
            this.feedbackService.setIsDraggingToolbar(true);
            const startX = md.offsetX;
            const startY = md.offsetY;
            this.disableToolbarTips = true;
            this.isDragging = true;
            // Calculate dif with mousemove until mouseup
            return mouseMove$.pipe(map((mm) => {
                mm.preventDefault();
                return {
                    left: mm.clientX - startX,
                    top: mm.clientY - startY,
                };
            }), finalize(() => {
                this.isDragging = false;
                this.disableToolbarTips = false;
                this.feedbackService.setIsDraggingToolbar(false);
            }), takeUntil(mouseUp$));
        }));
        move$.subscribe((pos) => {
            this.el.nativeElement.style.left = pos.left + 'px';
            this.el.nativeElement.style.top = pos.top + 'px';
        });
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], FeedbackToolbarComponent.prototype, "drawColor", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], FeedbackToolbarComponent.prototype, "manipulate", void 0);
__decorate([
    ViewChild('toggleMove'),
    __metadata("design:type", ElementRef)
], FeedbackToolbarComponent.prototype, "toggleMoveBtn", void 0);
FeedbackToolbarComponent = __decorate([
    Component({
        selector: 'feedback-toolbar',
        templateUrl: './feedback-toolbar.component.html',
        styleUrls: ['./feedback-toolbar.component.css'],
    }),
    __metadata("design:paramtypes", [ElementRef, FeedbackService])
], FeedbackToolbarComponent);
export { FeedbackToolbarComponent };
//# sourceMappingURL=../../../../../app/third_party/feedback/feedback-toolbar/feedback-toolbar.component.js.map