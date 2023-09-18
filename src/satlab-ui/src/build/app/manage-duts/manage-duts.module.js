var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { EditAttributesComponent } from './edit-attributes/edit-attributes.component';
import { EnrollmentComponent } from './enrollment/enrollment.component';
import { FirmwareComponent } from './firmware/firmware.component';
import { ManageDutsComponent } from './manage-duts.component';
import { ServicesModule } from '../services/services.module';
import { ViewDutsComponent } from './view-duts/view-duts.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { RunSuiteModule } from '../run-suite/run-suite.module';
import { FirmwareUpdateConfirmDialog, FirmwareUpdateResultDialog, } from './firmware/firmware.component';
import { PipesModule } from 'app/pipes/pipes.module';
import { ProvisionDialogComponent } from './provision-dialog/provision-dialog.component';
import { StageBuildDialogComponent } from './stage-build-dialog/stage-build-dialog.component';
let ManageDutsModule = class ManageDutsModule {
};
ManageDutsModule = __decorate([
    NgModule({
        imports: [
            CommonModule,
            FlexLayoutModule,
            FormsModule,
            MatButtonModule,
            MatCardModule,
            MatCheckboxModule,
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
            MatTabsModule,
            MatTooltipModule,
            PipesModule,
            ReactiveFormsModule,
            RouterModule,
            ServicesModule,
            WidgetsModule,
            MatDialogModule,
            RunSuiteModule,
        ],
        declarations: [
            EditAttributesComponent,
            EnrollmentComponent,
            FirmwareComponent,
            ManageDutsComponent,
            ViewDutsComponent,
            FirmwareUpdateConfirmDialog,
            FirmwareUpdateResultDialog,
            ProvisionDialogComponent,
            StageBuildDialogComponent,
        ],
        exports: [ManageDutsComponent],
    })
], ManageDutsModule);
export { ManageDutsModule };
//# sourceMappingURL=../../../app/manage-duts/manage-duts.module.js.map