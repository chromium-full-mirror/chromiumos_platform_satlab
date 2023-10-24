import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RunSuiteComponent} from './run_suite/run_suite.component';
import {OtherComponent} from './run_suite/other/other.component';
import {ManageDutsComponent} from "./manage-duts/manage-duts.component";
import {AboutComponent} from './about/about.component';
import {ConfigurationComponent} from "./configuration/configuration.component";
import {TestplanComponent} from './run_suite/testplan/testplan.component';

const routes: Routes = [
  {
    path: 'manage_duts',
    component: ManageDutsComponent,
  },
  {
    path: 'run_tests',
    component: RunSuiteComponent,
    children: [
      {path: 'other', component: OtherComponent},
      {path: 'testplan', component: TestplanComponent},
    ],
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {enableTracing: true, useHash: true})],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {
}
