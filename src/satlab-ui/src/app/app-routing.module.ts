import {AboutComponent} from './about/about.component';
import {ConfigurationComponent} from './configuration/configuration.component';
import {ManageDutsComponent} from './manage-duts/manage-duts.component';
import {AndroidBuildSelectFormComponent} from './run_suite/android/android-build-select-form/android-build-select-form.component';
import {LabqualComponent as AndroidLabqualComponent} from './run_suite/android/labqual/labqual.component';
import {PvsComponent as AndroidPvsComponent} from './run_suite/android/pvs/pvs.component';
import {RunComponent} from './run_suite/chromeos/run/run.component';
import {LabQualComponent} from './run_suite/lab-qual/lab-qual.component';
import {OtherComponent} from './run_suite/other/other.component';
import {PasitComponent} from './run_suite/pasit/pasit.component';
import {PvsComponent} from './run_suite/pvs/pvs.component';
import {QualificationsComponent} from './run_suite/pvs/qualifications/qualifications.component';
import {StorageQualComponent} from './run_suite/pvs/storage-qual/storage-qual.component';
import {RunSuiteComponent} from './run_suite/run_suite.component';
import {SingleTestComponent} from './run_suite/single-test/single-test.component';
import {TestplanComponent} from './run_suite/testplan/testplan.component';
import {checkLoggedIn} from './utils/auth-guard';
import {ViewJobsComponent} from './view-jobs/view-jobs.component';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {
    path: 'manage_duts',
    component: ManageDutsComponent,
    canActivate: [checkLoggedIn],
  },
  {
    path: 'run_tests',
    children: [
      {
        path: 'chromeos',
        component: RunSuiteComponent,
        children: [
          {path: 'other', component: OtherComponent},
          {path: 'test', component: SingleTestComponent},
          {path: 'testplan', component: TestplanComponent},
        ],
      },
      {
        path: 'android',
        children: [
          {path: '', component: AndroidBuildSelectFormComponent},
          {path: 'labqual', component: AndroidLabqualComponent},
          {path: 'pvs', component: AndroidPvsComponent},
        ],
      },
    ],
    canActivate: [checkLoggedIn],
  },
  {
    path: 'view_jobs',
    component: ViewJobsComponent,
    canActivate: [checkLoggedIn],
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
  },
  {
    path: 'pvs',
    children: [
      {path: '', component: PvsComponent},
      {path: 'storageQual', component: StorageQualComponent},
      {path: 'qualifications', component: QualificationsComponent},
    ],
    canActivate: [checkLoggedIn],
  },

  {path: 'labqual', component: LabQualComponent, canActivate: [checkLoggedIn]},
  {path: 'pasit', component: PasitComponent, canActivate: [checkLoggedIn]},
  {path: 'faft', component: RunComponent, canActivate: [checkLoggedIn]},
  {
    path: '**',
    component: ManageDutsComponent,
    canActivate: [checkLoggedIn],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {enableTracing: true, useHash: true})],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {}
