var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, } from '@angular/material/dialog';
import { MoblabGrpcService } from '../../services/moblab-grpc.service';
const DEFAULT_ERROR_SUFFIX = ' If this problem persists, please contact ' + 'chromeos-moblab@google.com';
let SubmissionResultDialog = class SubmissionResultDialog {
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
        this.title = '';
        this.message = '';
        this.message = data.message;
        this.title = data.title;
    }
    onNoClick() {
        this.dialogRef.close();
    }
};
SubmissionResultDialog = __decorate([
    Component({
        selector: 'submission-result-dialog',
        template: `
    <h1 mat-dialog-title>{{ title }}</h1>
    <div mat-dialog-content>
      <p>{{ message }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button cdkFocusInitial [mat-dialog-close]>Ok</button>
    </div>
  `,
    }),
    __param(1, Inject(MAT_DIALOG_DATA)),
    __metadata("design:paramtypes", [MatDialogRef, Object])
], SubmissionResultDialog);
export { SubmissionResultDialog };
let FeedbackComponent = 
/**
 * Component for pop-up UI for typing up feedback and submitting screenshots.
 */
class FeedbackComponent {
    constructor(dialog, moblabGrpcService) {
        this.dialog = dialog;
        this.moblabGrpcService = moblabGrpcService;
    }
    openDialog(message, title) {
        const dialogRef = this.dialog.open(SubmissionResultDialog, {
            width: '500px',
            data: { message: message, title: title },
        });
    }
    onSend(event) {
        this.moblabGrpcService.sendMoblabScreenshot((message) => {
            this.openDialog(message, 'Feedback Submitted');
        }, (message) => {
            this.openDialog(message + DEFAULT_ERROR_SUFFIX, 'Feedback Submission Failed');
        }, event.contactEmail, event.description, event.screenshot);
    }
};
FeedbackComponent = __decorate([
    Component({
        selector: 'app-feedback',
        template: `
    <mat-icon class="feedback-icon" feedback (send)="onSend($event)"
      >feedback</mat-icon
    >
  `,
        styleUrls: [],
    })
    /**
     * Component for pop-up UI for typing up feedback and submitting screenshots.
     */
    ,
    __metadata("design:paramtypes", [MatDialog,
        MoblabGrpcService])
], FeedbackComponent);
export { FeedbackComponent };
//# sourceMappingURL=../../../../app/widgets/feedback/feedback.component.js.map