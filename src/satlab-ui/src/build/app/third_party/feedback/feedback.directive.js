var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, HostListener, EventEmitter, Output, Input, } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent } from './feedback-dialog/feedback-dialog.component';
import { FeedbackService } from './feedback.service';
import { Overlay } from '@angular/cdk/overlay';
let FeedbackDirective = class FeedbackDirective {
    constructor(dialogRef, feedbackService, overlay) {
        this.dialogRef = dialogRef;
        this.feedbackService = feedbackService;
        this.title = 'Send feedback';
        this.placeholder = 'Describe your issue or share your ideas';
        this.editTip = 'Click to highlight or hide info';
        this.checkboxLabel = 'Include screenshot';
        this.cancelLabel = 'CANCEL';
        this.sendLabel = 'SEND';
        this.moveToolbarTip = 'move toolbar';
        this.drawRectTip = 'Draw using yellow to highlight issues or black to hide sensitive info';
        this.highlightTip = 'highlight issues';
        this.hideTip = 'hide sensitive info';
        this.editDoneLabel = 'DONE';
        this.send = new EventEmitter();
        this.feedbackService.feedback$.subscribe(feedback => {
            this.send.emit(feedback);
        });
        this.overlay = overlay;
    }
    onClick() {
        this.openFeedbackDialog();
    }
    openFeedbackDialog() {
        this.feedbackService.initScreenshotCanvas();
        const dialogRef = this.dialogRef.open(FeedbackDialogComponent, {
            panelClass: 'feedbackDialog',
            backdropClass: 'dialogBackDrop',
            disableClose: true,
            height: 'auto',
            width: 'auto',
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
        });
    }
    ngOnInit() {
        this.feedbackService.initialVariables = {
            title: this.title,
            placeholder: this.placeholder,
            editTip: this.editTip,
            checkboxLabel: this.checkboxLabel,
            cancelLabel: this.cancelLabel,
            sendLabel: this.sendLabel,
            moveToolbarTip: this.moveToolbarTip,
            drawRectTip: this.drawRectTip,
            highlightTip: this.highlightTip,
            hideTip: this.hideTip,
            editDoneLabel: this.editDoneLabel,
        };
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "editTip", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "checkboxLabel", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "cancelLabel", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "sendLabel", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "moveToolbarTip", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "drawRectTip", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "highlightTip", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "hideTip", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "editDoneLabel", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], FeedbackDirective.prototype, "send", void 0);
__decorate([
    HostListener('click'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FeedbackDirective.prototype, "onClick", null);
FeedbackDirective = __decorate([
    Directive({ selector: '[feedback]' }),
    __metadata("design:paramtypes", [MatDialog,
        FeedbackService,
        Overlay])
], FeedbackDirective);
export { FeedbackDirective };
//# sourceMappingURL=../../../../app/third_party/feedback/feedback.directive.js.map