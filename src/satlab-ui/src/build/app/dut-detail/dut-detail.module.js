var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { DutDetailComponent } from './dut-detail.component';
import { DutTaskTableComponent } from './dut_task_table/dut_task_table.component';
import { MatIconModule } from '@angular/material/icon';
import { ViewJobsModule } from '../view-jobs/view-jobs.module';
import { WidgetsModule } from '../widgets/widgets.module';
let DutDetailModule = class DutDetailModule {
};
DutDetailModule = __decorate([
    NgModule({
        imports: [
            CommonModule,
            FormsModule,
            MatButtonModule,
            MatCardModule,
            MatDividerModule,
            MatExpansionModule,
            MatFormFieldModule,
            MatIconModule,
            MatInputModule,
            MatPaginatorModule,
            MatTableModule,
            ReactiveFormsModule,
            ViewJobsModule,
            WidgetsModule,
        ],
        declarations: [DutDetailComponent, DutTaskTableComponent],
        exports: [DutDetailComponent],
    })
], DutDetailModule);
export { DutDetailModule };
//# sourceMappingURL=../../../app/dut-detail/dut-detail.module.js.map