var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ServicesModule_1;
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { GlobalInfoService } from './global-ui-settings.service';
import { ConfigSetupService } from './moblab-configuration-alerting.service';
import { Feature } from './global-ui-settings.service';
import { MoblabGrpcService } from './moblab-grpc.service';
let ServicesModule = ServicesModule_1 = class ServicesModule {
    static forRoot() {
        return {
            ngModule: ServicesModule_1,
            providers: [
                { provide: MoblabGrpcService, useClass: MoblabGrpcService },
                { provide: GlobalInfoService, useClass: GlobalInfoService },
                { provide: ConfigSetupService, useClass: ConfigSetupService },
            ],
        };
    }
};
ServicesModule = ServicesModule_1 = __decorate([
    NgModule({
        imports: [HttpClientModule],
    })
], ServicesModule);
export { ServicesModule };
export { MoblabGrpcService, GlobalInfoService, ConfigSetupService, Feature };
//# sourceMappingURL=../../../app/services/services.module.js.map