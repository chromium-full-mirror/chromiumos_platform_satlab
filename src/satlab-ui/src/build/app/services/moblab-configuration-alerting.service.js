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
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
let ConfigSetupService = class ConfigSetupService {
    constructor() {
        this.isCloudConfigEnabled = false;
        this.error = false;
        this.enabled$ = new BehaviorSubject(this.isCloudConfigEnabled);
        this.error$ = new BehaviorSubject(this.error);
        this.cloudConfigObservable = this.getCloudConfigObservable();
    }
    getCloudConfigObservable() {
        return combineLatest([
            this.enabled$.asObservable(),
            this.error$.asObservable(),
        ]).pipe(map(data => ({
            enabled: data[0],
            error: data[1],
        })));
    }
    setState(enabled, error) {
        /**
         * Set the state of the service.
         */
        this.setIsCloudConfigEnabled(enabled);
        this.setError(error);
    }
    getError() {
        /**
         * Get 'error' status of cloud configuration.
         */
        return this.error;
    }
    setError(error) {
        /**
         * Set to true when unable to retrieve the status of cloud configuration.
         */
        this.error = error;
        this.error$.next(this.error);
    }
    setIsCloudConfigEnabled(isCloudConfigEnabled) {
        /**
         * Set 'enabled' status of cloud configuration.
         */
        this.isCloudConfigEnabled = isCloudConfigEnabled;
        this.enabled$.next(this.isCloudConfigEnabled);
    }
    getIsCloudConfigEnabled() {
        /**
         * Get if cloud configuration has been enabled.
         */
        return this.isCloudConfigEnabled;
    }
};
ConfigSetupService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ConfigSetupService);
export { ConfigSetupService };
//# sourceMappingURL=../../../app/services/moblab-configuration-alerting.service.js.map