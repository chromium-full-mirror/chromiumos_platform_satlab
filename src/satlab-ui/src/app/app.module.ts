import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {LayoutModule} from '@angular/cdk/layout';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatRadioModule} from '@angular/material/radio';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {AppSidebarComponent} from './app-sidebar/app-sidebar.component';
import {BasicSelectorComponent} from './run_suite/common/basic-selector/basic-selector.component';
import {BuildSelectFormComponent} from './run_suite/common/build-select-form/build-select-form.component';
import {OtherComponent} from './run_suite/other/other.component';
import {LoadingComponent} from './run_suite/common/loading/loading.component';
import {RunSuiteComponent} from './run_suite/run_suite.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {ManageDutsComponent} from './manage-duts/manage-duts.component';
import {ViewDutsComponent} from './manage-duts/view-duts/view-duts.component';
import {EnrollmentComponent} from './manage-duts/enrollment/enrollment.component';
import {FirmwareComponent} from './manage-duts/firmware/firmware.component';
import {AboutComponent} from './about/about.component';
import {SpinnerLoadingComponent} from './common/spinner-loading/spinner-loading.component';
import {ProvisionComponent} from './dialogs/provision/provision.component';
import {MatDialogModule} from '@angular/material/dialog';
import {NotificationComponent} from './common/notification/notification.component';
import {ConfigurationComponent} from './configuration/configuration.component';
import {TestplanComponent} from './run_suite/testplan/testplan.component';
import {AutocompleteSelectorComponent} from './run_suite/common/autocomplete-selector/autocomplete-selector.component';
import {StageBuildComponent} from './dialogs/stage-build/stage-build.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {SingleTestComponent} from './run_suite/single-test/single-test.component';
import {ViewJobsComponent} from './view-jobs/view-jobs.component';
import {ClickDetectorDirective} from './click-detector.directive';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {CustomDatepickerComponent} from './custom-datepicker/custom-datepicker.component';
import {InfiniteScrollDirective} from './infinite-scroll.directive';
import {JobTableComponent} from './view-jobs/job-table/job-table.component';
import {StorageQualComponent} from './run_suite/pvs/storage-qual/storage-qual.component';
import {CircularProgressComponent} from './common/circular-progress/circular-progress.component';
import {QualificationsComponent} from './run_suite/pvs/qualifications/qualifications.component';
import {PvsComponent} from './run_suite/pvs/pvs.component';
import {AdvancedSettingsComponent} from './run_suite/common/advanced-settings/advanced-settings.component';
import {OpenCcdComponent} from './dialogs/open-ccd/open-ccd.component';
import {LabQualComponent} from './run_suite/lab-qual/lab-qual.component';
import {LoadingButtonComponent} from './common/loading-button/loading-button.component';
import {BuildSelectorComponent} from './run_suite/common/build-selector/build-selector.component';

@NgModule({
  declarations: [
    AppComponent,
    AppSidebarComponent,
    BasicSelectorComponent,
    BuildSelectFormComponent,
    OtherComponent,
    LoadingComponent,
    RunSuiteComponent,
    ManageDutsComponent,
    ViewDutsComponent,
    EnrollmentComponent,
    FirmwareComponent,
    AboutComponent,
    SpinnerLoadingComponent,
    ProvisionComponent,
    NotificationComponent,
    ConfigurationComponent,
    TestplanComponent,
    AutocompleteSelectorComponent,
    StageBuildComponent,
    SingleTestComponent,
    ViewJobsComponent,
    ClickDetectorDirective,
    CustomDatepickerComponent,
    InfiniteScrollDirective,
    JobTableComponent,
    StorageQualComponent,
    CircularProgressComponent,
    QualificationsComponent,
    PvsComponent,
    AdvancedSettingsComponent,
    OpenCcdComponent,
    LabQualComponent,
    BuildSelectorComponent,
    LoadingButtonComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    LayoutModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSidenavModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    RouterModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatButtonToggleModule,
    MatRadioModule,
  ],
  exports: [
    AppRoutingModule,
    MatCardModule,
    MatMenuModule,
    MatTableModule,
    RouterModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
