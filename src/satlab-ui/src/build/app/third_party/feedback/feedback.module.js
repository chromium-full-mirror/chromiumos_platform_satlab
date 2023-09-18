var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeedbackDialogComponent } from './feedback-dialog/feedback-dialog.component';
import { FeedbackToolbarComponent } from './feedback-toolbar/feedback-toolbar.component';
import { FeedbackRectangleComponent } from './feedback-rectangle/feedback-rectangle.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeedbackService } from './feedback.service';
import { FeedbackDirective } from './feedback.directive';
let FeedbackModule = class FeedbackModule {
};
FeedbackModule = __decorate([
    NgModule({
        declarations: [
            FeedbackDialogComponent,
            FeedbackToolbarComponent,
            FeedbackRectangleComponent,
            FeedbackDirective,
        ],
        imports: [
            MatDialogModule,
            MatButtonModule,
            MatFormFieldModule,
            MatIconModule,
            MatInputModule,
            MatTooltipModule,
            CommonModule,
            FormsModule,
            MatCheckboxModule,
            MatProgressSpinnerModule,
            ReactiveFormsModule,
        ],
        exports: [FeedbackDirective],
        entryComponents: [FeedbackDialogComponent],
        providers: [FeedbackService],
    })
], FeedbackModule);
export { FeedbackModule };
//# sourceMappingURL=../../../../app/third_party/feedback/feedback.module.js.map