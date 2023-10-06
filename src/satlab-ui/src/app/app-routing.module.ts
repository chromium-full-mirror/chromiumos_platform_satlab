import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RunSuiteComponent} from './run_suite/run_suite.component';
import {OtherComponent} from './run_suite/other/other.component';

const routes: Routes = [
  {
    path: 'run_tests',
    component: RunSuiteComponent,
    children: [{path: 'other', component: OtherComponent}],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {enableTracing: true, useHash: true})],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {}
