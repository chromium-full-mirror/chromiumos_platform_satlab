var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { JobActionComponent } from './job-action/job-action.component';
import { ViewJobsComponent } from './view-jobs.component';
import { WidgetsModule } from '../widgets/widgets.module';
let ViewJobsModule = class ViewJobsModule {
};
ViewJobsModule = __decorate([
    NgModule({
        imports: [
            BrowserAnimationsModule,
            CommonModule,
            FormsModule,
            MatBadgeModule,
            MatButtonModule,
            MatCardModule,
            MatCheckboxModule,
            MatButtonToggleModule,
            MatChipsModule,
            MatExpansionModule,
            MatFormFieldModule,
            MatIconModule,
            MatInputModule,
            MatListModule,
            MatPaginatorModule,
            MatProgressSpinnerModule,
            MatSelectModule,
            MatSortModule,
            MatTableModule,
            MatTooltipModule,
            ReactiveFormsModule,
            RouterModule,
            WidgetsModule,
            MatSlideToggleModule,
        ],
        declarations: [JobActionComponent, ViewJobsComponent],
        exports: [MatBadgeModule, ViewJobsComponent],
    })
], ViewJobsModule);
export { ViewJobsModule };
//# sourceMappingURL=../../../app/view-jobs/view-jobs.module.js.map