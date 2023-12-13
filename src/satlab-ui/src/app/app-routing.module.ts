import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RunSuiteComponent} from './run_suite/run_suite.component';
import {OtherComponent} from './run_suite/other/other.component';
import {ManageDutsComponent} from './manage-duts/manage-duts.component';
import {AboutComponent} from './about/about.component';
import {ConfigurationComponent} from './configuration/configuration.component';
import {TestplanComponent} from './run_suite/testplan/testplan.component';
import {checkLoggedIn} from './utils/auth-guard';
import {ViewJobsComponent} from './view-jobs/view-jobs.component';
import {StorageQualComponent} from './run_suite/pvs/storage-qual/storage-qual.component';
import {SingleTestComponent} from './run_suite/single-test/single-test.component';

const routes: Routes = [
  {
    path: 'manage_duts',
    component: ManageDutsComponent,
    canActivate: [checkLoggedIn],
  },
  {
    path: 'run_tests',
    component: RunSuiteComponent,
    children: [
      {path: 'other', component: OtherComponent},
      {path: 'test', component: SingleTestComponent},
      {path: 'testplan', component: TestplanComponent},
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
    path: 'storage_qualification',
    component: StorageQualComponent,
    canActivate: [checkLoggedIn],
  },
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
