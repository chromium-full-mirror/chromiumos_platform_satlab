var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { MoblabHealthCheckService } from '../services/moblab-health-check.service';
let MoblabHealthCheckGuard = class MoblabHealthCheckGuard {
    constructor(router, healthCheckService) {
        this.router = router;
        this.healthCheckService = healthCheckService;
    }
    canActivate() {
        if (environment.disableHealthCheckGuard) {
            return true;
        }
        return this.healthCheckService
            .isMoblabServiceHealthy()
            .then(healthy => {
            if (!healthy) {
                this.router.navigate(['/health_check']);
                return false;
            }
            return true;
        })
            .catch(error => {
            console.error('Failed to get the status from mobmonitor', error);
            this.router.navigate(['/health_check']);
            return false;
        });
    }
};
MoblabHealthCheckGuard = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __metadata("design:paramtypes", [Router,
        MoblabHealthCheckService])
], MoblabHealthCheckGuard);
export { MoblabHealthCheckGuard };
//# sourceMappingURL=../../../app/guards/moblab-health-check.guard.js.map