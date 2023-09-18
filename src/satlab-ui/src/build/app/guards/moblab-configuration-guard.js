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
import { MoblabGrpcService } from '../services/moblab-grpc.service';
import { ConfigSetupService } from '../services/moblab-configuration-alerting.service';
import { NotificationsService } from '../services/notifications.service';
import { environment } from 'environments/environment';
let ConfigGuard = class ConfigGuard {
    constructor(router, moblabRpcService, configSetupService, notificationsService) {
        this.router = router;
        this.moblabRpcService = moblabRpcService;
        this.configSetupService = configSetupService;
        this.notificationsService = notificationsService;
    }
    canActivate() {
        if (environment.disableConfigGuard) {
            this.configSetupService.setIsCloudConfigEnabled(true);
            return Promise.resolve(true);
        }
        return new Promise((resolve, _) => {
            this.moblabRpcService.get_cloud_configuration((boto_key_id, boto_key_secret, gcs_bucket_url, is_cloud_enabled, is_remote_console_enabled, is_remote_command_enabled) => {
                if (!this.configSetupService.getIsCloudConfigEnabled()) {
                    this.router.navigate(['/config']);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            }, (errorMsg) => {
                this.notificationsService.error('Failed to get cloud configuration: ' + errorMsg);
            });
        });
    }
};
ConfigGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Router,
        MoblabGrpcService,
        ConfigSetupService,
        NotificationsService])
], ConfigGuard);
export { ConfigGuard };
//# sourceMappingURL=../../../app/guards/moblab-configuration-guard.js.map