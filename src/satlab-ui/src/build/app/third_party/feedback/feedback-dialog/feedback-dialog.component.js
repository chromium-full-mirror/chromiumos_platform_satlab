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
import { takeUntil, finalize, map, mergeMap, } from 'rxjs/operators';
import { Component, ViewChild, ElementRef, ChangeDetectorRef, HostListener, } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Feedback } from '../entity/feedback';
import { FeedbackService } from '../feedback.service';
import { Rectangle } from '../entity/rectangle';
let FeedbackDialogComponent = class FeedbackDialogComponent {
    constructor(dialogRef, feedbackService, detector, el) {
        this.dialogRef = dialogRef;
        this.feedbackService = feedbackService;
        this.detector = detector;
        this.el = el;
        this.showToolbar = false;
        this.vars = {};
        this.feedback = new Feedback();
        this.emailFormControl = new FormControl();
        this.includeScreenshot = true;
        this.showSpinner = true;
        this.showToolbarTips = true;
        this.drawColor = this.feedbackService.highlightedColor;
        this.rectangles = [];
        this.scrollWidth = document.documentElement.scrollWidth;
        this.scrollHeight = document.documentElement.scrollHeight;
        this.elCouldBeHighlighted = [
            'button',
            'a',
            'span',
            'em',
            'i',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'p',
            'strong',
            'small',
            'sub',
            'sup',
            'b',
            'time',
            'img',
            'video',
            'input',
            'label',
            'select',
            'textarea',
            'article',
            'summary',
            'section',
        ];
        this.isDrawingRect = false;
        this.feedback = new Feedback();
        this.feedback.description = '';
        this.feedback.contactEmail = '';
        this.vars = this.feedbackService.initialVariables;
    }
    ngOnInit() {
        this.emailFormControl
            .setValidators([
            // Regex source is from https://www.regular-expressions.info/email.html
            Validators.pattern(/[a-z0-9!#$%&'*+/=?^_<E2><80><98>{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_<E2><80><98>{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/),
            Validators.required,
        ]);
    }
    ngAfterViewInit() {
        this.feedbackService.screenshotCanvas$.subscribe(canvas => {
            this.showSpinner = false;
            this.feedback.screenshot = canvas.toDataURL('image/png');
            this.screenshotEle = this.feedbackService.getImgEle(canvas);
            this.appendScreenshot();
        });
        this.feedbackService.isDraggingToolbar$.subscribe(isDragging => {
            if (isDragging) {
                this.destroyCanvasListeners();
            }
            else {
                this.addCanvasListeners();
            }
        });
        this.dialogRef.afterClosed().subscribe(sendNow => {
            if (sendNow === true) {
                this.feedbackService.setFeedback(this.feedback);
            }
        });
        this.feedbackService.showBackDrop();
    }
    isInvalid() {
        return !this.feedback.contactEmail || this.emailFormControl.invalid;
    }
    expandDrawingBoard() {
        this.showToolbar = true;
        if (!this.drawCanvas) {
            this.detector.detectChanges();
            this.initBackgroundCanvas();
            this.feedbackService.hideBackDrop();
        }
        this.addCanvasListeners();
        this.el.nativeElement.appendChild(this.drawCanvas);
        this.feedbackService.hideBackDrop();
        console.log('expand the board');
    }
    onEscapeKeyDownHandler(evt) {
        this.showToolbar = false;
        this.includeScreenshot = true;
        this.detector.detectChanges();
        this.dialogRef.close('key down esc to close');
    }
    manipulate(manipulation) {
        if (manipulation === 'done') {
            this.showToolbarTips = false;
            this.showSpinner = true;
            this.destroyCanvasListeners();
            this.showToolbar = false;
            this.detector.detectChanges();
            this.feedbackService.initScreenshotCanvas();
        }
        else {
            this.startDraw(manipulation);
        }
    }
    startDraw(color) {
        this.drawColor = color;
    }
    isIncludeScreenshot() {
        if (this.includeScreenshot) {
            this.detector.detectChanges();
            this.showSpinner = false;
            this.appendScreenshot();
            this.feedback.screenshot = this.screenshotEle.getAttribute('src');
        }
        else {
            delete this.feedback['screenshot'];
            this.showSpinner = true;
        }
    }
    appendScreenshot() {
        if (this.screenshotParent) {
            this.screenshotParent.nativeElement.appendChild(this.screenshotEle);
        }
    }
    initBackgroundCanvas() {
        this.drawCanvas = document.getElementById('draw-canvas');
        // The canvas to draw, must use this way to initial the height and width
        this.drawCanvas.style.height = this.scrollHeight + '';
        this.drawCanvas.style.width = this.scrollWidth + '';
        this.drawCanvas.height = this.scrollHeight;
        this.drawCanvas.width = this.scrollWidth;
        this.drawContainerRect();
    }
    drawContainerRect() {
        const drawContext = this.drawCanvas.getContext('2d'), width = this.scrollWidth, height = this.scrollHeight;
        drawContext.beginPath();
        drawContext.fillStyle = 'rgba(0,0,0,0.3)';
        drawContext.clearRect(0, 0, width, height);
        drawContext.fillRect(0, 0, width, height); // draw the rectangle
    }
    drawRectangle(rect) {
        const context = this.drawCanvas.getContext('2d');
        context.lineJoin = 'round';
        context.beginPath();
        if (rect.color === this.feedbackService.hiddenColor) {
            context.fillStyle = 'rgba(31, 31, 31, 0.75)';
            context.fillRect(rect.startX, rect.startY, rect.width, rect.height);
            context.rect(rect.startX, rect.startY, rect.width, rect.height);
        }
        else {
            context.clearRect(rect.startX, rect.startY, rect.width, rect.height);
            context.lineWidth = 5;
            context.strokeStyle = rect.color;
            context.rect(rect.startX, rect.startY, rect.width, rect.height);
            context.stroke();
            context.clearRect(rect.startX, rect.startY, rect.width, rect.height);
            this.rectangles.forEach(tmpRect => {
                if (tmpRect.color === this.feedbackService.highlightedColor) {
                    context.clearRect(tmpRect.startX, tmpRect.startY, tmpRect.width, tmpRect.height);
                }
            });
        }
    }
    addCanvasListeners() {
        const mouseDown$ = observableFromEvent(document.documentElement, 'mousedown');
        const mouseUp$ = observableFromEvent(document.documentElement, 'mouseup');
        const mouseMove$ = observableFromEvent(document.documentElement, 'mousemove');
        const scroll = observableFromEvent(window, 'scroll');
        this.manuallyDrawRect(mouseDown$, mouseMove$, mouseUp$);
        this.autoDrawRect(mouseMove$);
        this.changeRectPosition(scroll);
    }
    changeRectPosition(scroll) {
        scroll.subscribe(event => {
            const currentWindowScrollX = window.scrollX, currentWindowScrollY = window.scrollY;
            this.rectangles.forEach(rect => {
                rect.startY =
                    rect.startY - (currentWindowScrollY - rect.windowScrollY);
                rect.startX =
                    rect.startX - (currentWindowScrollX - rect.windowScrollX);
                rect.windowScrollY = currentWindowScrollY;
                rect.windowScrollX = currentWindowScrollX;
            });
            this.drawPersistCanvasRectangles();
        }, error => console.error(error));
    }
    destroyCanvasListeners() {
        if (this.manuallyDrawRect$) {
            this.manuallyDrawRect$.unsubscribe();
        }
        if (this.autoDrawRect$) {
            this.autoDrawRect$.unsubscribe();
        }
    }
    manuallyDrawRect(mouseDown, mouseMove, mouseUp) {
        const mouseDrag = mouseDown.pipe(mergeMap((mouseDownEvent) => {
            if (this.showToolbarTips) {
                this.showToolbarTips = false;
            }
            this.autoDrawRect$.unsubscribe();
            this.isDrawingRect = true;
            const newRectangle = new Rectangle();
            newRectangle.startX = mouseDownEvent.clientX;
            newRectangle.startY = mouseDownEvent.clientY;
            newRectangle.color = this.drawColor;
            return mouseMove.pipe(map((mouseMoveEvent) => {
                newRectangle.width =
                    mouseMoveEvent.clientX - mouseDownEvent.clientX;
                newRectangle.height =
                    mouseMoveEvent.clientY - mouseDownEvent.clientY;
                return newRectangle;
            }), finalize(() => {
                // click to draw rectangle
                if (newRectangle.width === undefined ||
                    newRectangle.height === undefined ||
                    newRectangle.width === 0 ||
                    newRectangle.height === 0) {
                    const rect = this.drawTempCanvasRectangle(mouseDownEvent);
                    if (rect) {
                        this.rectangles.push(rect);
                    }
                }
                else {
                    // drag to draw rectangle
                    if (newRectangle.height < 0) {
                        newRectangle.startY = newRectangle.startY + newRectangle.height;
                        newRectangle.height = Math.abs(newRectangle.height);
                    }
                    if (newRectangle.width < 0) {
                        newRectangle.startX = newRectangle.startX + newRectangle.width;
                        newRectangle.width = Math.abs(newRectangle.width);
                    }
                    this.rectangles.push(newRectangle);
                }
                this.drawPersistCanvasRectangles();
                this.autoDrawRect(mouseMove);
                this.isDrawingRect = false;
            }), takeUntil(mouseUp));
        }));
        this.manuallyDrawRect$ = mouseDrag.subscribe(rec => {
            this.drawPersistCanvasRectangles();
            this.drawRectangle(rec);
        });
    }
    autoDrawRect(mouseMove) {
        this.autoDrawRect$ = mouseMove.subscribe({
            next: (mouseMoveEvent) => {
                this.drawPersistCanvasRectangles();
                this.drawTempCanvasRectangle(mouseMoveEvent);
            },
            error: err => console.error('something wrong occurred: ' + err),
        });
    }
    drawPersistCanvasRectangles() {
        this.drawContainerRect();
        this.rectangles.forEach(tmpRect => {
            this.drawRectangle(tmpRect);
        });
    }
    drawTempCanvasRectangle(event) {
        let rectangle = null;
        const clientX = event.clientX, clientY = event.clientY, els = document.elementsFromPoint(clientX, clientY), el = els[2];
        if (!this.isExcludeRect(els) &&
            el &&
            this.elCouldBeHighlighted.indexOf(el.nodeName.toLowerCase()) > -1) {
            rectangle = new Rectangle();
            const rect = el.getBoundingClientRect();
            this.drawCanvas.style.cursor = 'pointer';
            Object.assign(rectangle, {
                startX: rect.left,
                startY: rect.top,
                width: rect.width,
                height: rect.height,
                color: this.drawColor,
            });
            this.drawRectangle(rectangle);
        }
        else {
            this.drawCanvas.style.cursor = 'crosshair';
        }
        return rectangle;
    }
    closeRect(index) {
        this.rectangles.splice(index, 1);
        this.drawPersistCanvasRectangles();
    }
    isExcludeRect(elements) {
        const result = elements.some(el => {
            return el.getAttribute('exclude-rect') === 'true';
        });
        return result;
    }
};
__decorate([
    ViewChild('screenshotParent'),
    __metadata("design:type", ElementRef)
], FeedbackDialogComponent.prototype, "screenshotParent", void 0);
__decorate([
    HostListener('document:keydown.escape', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeyboardEvent]),
    __metadata("design:returntype", void 0)
], FeedbackDialogComponent.prototype, "onEscapeKeyDownHandler", null);
FeedbackDialogComponent = __decorate([
    Component({
        selector: 'feedback-dialog',
        templateUrl: './feedback-dialog.component.html',
        styleUrls: ['./feedback-dialog.component.css'],
    }),
    __metadata("design:paramtypes", [MatDialogRef,
        FeedbackService,
        ChangeDetectorRef,
        ElementRef])
], FeedbackDialogComponent);
export { FeedbackDialogComponent };
//# sourceMappingURL=../../../../../app/third_party/feedback/feedback-dialog/feedback-dialog.component.js.map