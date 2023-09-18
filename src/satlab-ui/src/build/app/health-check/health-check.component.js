var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component } from '@angular/core';
import { timer } from 'rxjs';
import { Router } from '@angular/router';
import { GlobalInfoService } from '../services/global-ui-settings.service';
import { MoblabHealthCheckService, } from '../services/moblab-health-check.service';
import { MoblabHealthCheckConstants } from '../constants';
let HealthCheckComponent = class HealthCheckComponent {
    constructor(router, healthCheckService, globalInfoService) {
        this.router = router;
        this.healthCheckService = healthCheckService;
        this.globalInfoService = globalInfoService;
        this.serviceHealthChecks = [];
        this.failedHealthChecks = [];
        this.loadingContainers = [];
        this.expectedContainers = MoblabHealthCheckConstants.MOBLAB_CONTAINERS_COUNT;
        this.mobmonitorLink = this.getMobmonitorLink();
        /** List of errors to bypass so the redirect can go through */
        this.failedCheckIgnoreList = ['BotoFile'];
    }
    ngOnInit() {
        this.globalInfoService.setEnableNavBar(false);
        this.subscription = timer(1000, 20000).subscribe(() => {
            this.healthCheckService.getMobmonitorHealthCheck().subscribe({
                next: data => {
                    this.handleMoblabHealthCheck(data);
                },
                error: error => {
                    this.isMobMonitorHealthy = false;
                    console.error('Failed to get the health status from mobmonitor', error);
                },
            });
        });
    }
    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.globalInfoService.setEnableNavBar(true);
    }
    handleMoblabHealthCheck(services) {
        this.isMobMonitorHealthy = true;
        this.serviceHealthChecks = services;
        this.moblabServiceHealth = services.filter(data => data.service === 'moblab')[0];
        this.loadingContainers = this.moblabServiceHealth.healthchecks.filter(container => container.health === true);
        this.failedHealthChecks = this.moblabServiceHealth.healthchecks.filter(container => container.health === false);
        this.loadingPercentage =
            ((this.expectedContainers - this.loadingContainers.length) /
                this.expectedContainers) *
                100;
        const criticalFailedChecks = this.failedHealthChecks.filter(failedCheck => !this.failedCheckIgnoreList.includes(failedCheck.name));
        const isMoblabHealhty = this.loadingContainers.length === 0 && criticalFailedChecks.length === 0;
        if (isMoblabHealhty) {
            this.router.navigate(['/']);
        }
    }
    getMobmonitorLink() {
        const hostname = window.location.hostname;
        return `http://${hostname}:9991/static/index.html`;
    }
};
HealthCheckComponent = __decorate([
    Component({
        selector: 'app-health-check',
        templateUrl: './health-check.component.html',
        styleUrls: [
            './health-check.component.scss',
            '../configuration/configuration.component.scss',
        ],
    }),
    __metadata("design:paramtypes", [Router,
        MoblabHealthCheckService,
        GlobalInfoService])
], HealthCheckComponent);
export { HealthCheckComponent };
//# sourceMappingURL=../../../app/health-check/health-check.component.js.map