var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, EventEmitter, HostListener, Input, Output, } from '@angular/core';
import { Rectangle } from '../entity/rectangle';
import { FeedbackService } from '../feedback.service';
let FeedbackRectangleComponent = class FeedbackRectangleComponent {
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
        this.close = new EventEmitter();
        this.showCloseTag = false;
    }
    onMouseEnter() {
        this.showCloseTag = this.noHover === false;
    }
    onMouseLeave() {
        this.showCloseTag = false;
    }
    onClose() {
        this.close.emit();
    }
};
__decorate([
    Input(),
    __metadata("design:type", Rectangle)
], FeedbackRectangleComponent.prototype, "rectangle", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], FeedbackRectangleComponent.prototype, "noHover", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], FeedbackRectangleComponent.prototype, "close", void 0);
__decorate([
    HostListener('mouseenter'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FeedbackRectangleComponent.prototype, "onMouseEnter", null);
__decorate([
    HostListener('mouseleave'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FeedbackRectangleComponent.prototype, "onMouseLeave", null);
FeedbackRectangleComponent = __decorate([
    Component({
        selector: 'feedback-rectangle',
        templateUrl: './feedback-rectangle.component.html',
        styleUrls: ['./feedback-rectangle.component.css'],
    }),
    __metadata("design:paramtypes", [FeedbackService])
], FeedbackRectangleComponent);
export { FeedbackRectangleComponent };
//# sourceMappingURL=../../../../../app/third_party/feedback/feedback-rectangle/feedback-rectangle.component.js.map