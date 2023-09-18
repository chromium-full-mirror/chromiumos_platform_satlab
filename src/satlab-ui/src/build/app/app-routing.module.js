var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { APP_BASE_HREF } from '@angular/common';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfigurationComponent } from './configuration/configuration.component';
import { CtsRunComponent } from './run-suite/custom-run-suite/cts-run/cts-run.component';
import { DutDetailComponent } from './dut-detail/dut-detail.component';
import { JobDetailComponent } from './job-detail/job-detail.component';
import { ManageDutsComponent } from './manage-duts/manage-duts.component';
import { MobmonitorComponent } from './mobmonitor/mobmonitor.component';
import { RunSuiteComponent } from './run-suite/run-suite.component';
import { StorageQualV2Component } from './run-suite/custom-run-suite/storage-qual-v2/storage-qual-v2.component';
import { ViewJobsComponent } from './view-jobs/view-jobs.component';
import { ConfigGuard } from './guards/moblab-configuration-guard';
import { HealthCheckComponent } from './health-check/health-check.component';
import { MoblabHealthCheckGuard } from './guards/moblab-health-check.guard';
import { NewUpdateService } from './services/new-update.service';
import { AboutComponent } from './about/about.component';
const routes = [
    { path: 'health_check', component: HealthCheckComponent },
    {
        path: '',
        canActivate: [MoblabHealthCheckGuard],
        children: [
            { path: 'config', component: ConfigurationComponent },
            {
                path: '',
                canActivate: [ConfigGuard],
                children: [
                    { path: 'view_jobs', component: ViewJobsComponent },
                    { path: 'job_detail', component: JobDetailComponent },
                    { path: 'job_detail/:job_id', component: JobDetailComponent },
                    { path: 'dut_detail', component: DutDetailComponent },
                    { path: 'dut_detail/:dut_hostname', component: DutDetailComponent },
                    {
                        path: 'run_tests',
                        component: RunSuiteComponent,
                        children: [
                            { path: 'cts', component: CtsRunComponent },
                            { path: 'storagequal', component: StorageQualV2Component },
                            { path: 'memoryqual', component: StorageQualV2Component },
                            { path: 'bvtqual', component: StorageQualV2Component },
                            { path: 'powerqual', component: StorageQualV2Component },
                            { path: 'runsuite', component: StorageQualV2Component },
                        ],
                    },
                    { path: 'manage_dut', component: ManageDutsComponent },
                    { path: 'mobmonitor', component: MobmonitorComponent },
                    { path: 'about', component: AboutComponent },
                    { path: 'report_problem', component: ViewJobsComponent },
                    { path: '**', component: ViewJobsComponent },
                ],
            },
        ],
    },
];
let AppRoutingModule = class AppRoutingModule {
};
AppRoutingModule = __decorate([
    NgModule({
        imports: [RouterModule.forRoot(routes, { enableTracing: true, useHash: true })],
        exports: [RouterModule],
        providers: [
            { provide: APP_BASE_HREF, useValue: '' },
            {
                provide: APP_INITIALIZER,
                useFactory: (newUpdateService) => () => newUpdateService.pollForUpdates(),
                deps: [NewUpdateService],
                multi: true,
            },
            ConfigGuard,
        ],
    })
], AppRoutingModule);
export { AppRoutingModule };
//# sourceMappingURL=../../app/app-routing.module.js.map