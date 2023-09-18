var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { Subject } from 'rxjs';
let FeedbackService = class FeedbackService {
    constructor() {
        this.initialVariables = {};
        this.highlightedColor = 'yellow';
        this.hiddenColor = 'black';
        this.screenshotCanvasSource = new Subject();
        this.screenshotCanvas$ = this.screenshotCanvasSource.asObservable();
        this.feedbackSource = new Subject();
        this.feedback$ = this.feedbackSource.asObservable();
        this.isDraggingToolbarSource = new Subject();
        this.isDraggingToolbar$ = this.isDraggingToolbarSource.asObservable();
    }
    initScreenshotCanvas() {
        const body = document.body;
        html2canvas(body, {
            logging: false,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            x: document.documentElement.scrollLeft,
            y: document.documentElement.scrollTop,
            allowTaint: true,
        }).then(bodyCanvas => {
            this.screenshotCanvasSource.next(bodyCanvas);
        });
    }
    setCanvas(canvas) {
        this.screenshotCanvasSource.next(canvas);
    }
    setFeedback(feedback) {
        this.feedbackSource.next(feedback);
    }
    setIsDraggingToolbar(isDragging) {
        this.isDraggingToolbarSource.next(isDragging);
    }
    getImgEle(canvas) {
        const img = canvas.toDataURL('image/png'), imageEle = document.createElement('img');
        imageEle.setAttribute('src', img);
        Object.assign(imageEle.style, {
            position: 'absolute',
            top: '50%',
            right: '0',
            left: '0',
            margin: '0 auto',
            maxHeight: '100%',
            maxWidth: '100%',
            transform: 'translateY(-50%)',
        });
        return imageEle;
    }
    hideBackDrop() {
        const dialogBackDrop = document.getElementsByClassName('dialogBackDrop')[0];
        dialogBackDrop.style.backgroundColor = 'initial';
    }
    showBackDrop() {
        const dialogBackDrop = document.getElementsByClassName('dialogBackDrop')[0];
        if (!dialogBackDrop.getAttribute('data-html2canvas-ignore')) {
            dialogBackDrop.setAttribute('data-html2canvas-ignore', 'true');
        }
        dialogBackDrop.style.backgroundColor = 'rgba(0, 0, 0, .288)';
    }
};
FeedbackService = __decorate([
    Injectable()
], FeedbackService);
export { FeedbackService };
//# sourceMappingURL=../../../../app/third_party/feedback/feedback.service.js.map