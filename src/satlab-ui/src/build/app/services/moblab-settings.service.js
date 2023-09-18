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
import { BehaviorSubject, merge } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { MoblabConfigurationGrpcService } from 'app/services/moblab-configuration-grpc.service';
// The service provides live updates to test runner status.
// Subscribe to pauseRequestors observable to recieve live
// updates on job scheduling pause requests.
let MoblabSettingsService = class MoblabSettingsService {
    // Starting a background process to check on system pause state
    constructor(grpcService) {
        this.grpcService = grpcService;
        this.pauseRequestorsSubject = new BehaviorSubject([]);
        this.pauseRequestorsObservable = merge(this.pauseRequestorsSubject.asObservable(), this.grpcService.pauseStateObservable).pipe(shareReplay(1));
    }
    updateHostSchedulingStatus(pauseRequesters) {
        try {
            this.pauseRequestorsSubject.next(pauseRequesters);
        }
        catch (ex) {
            console.log('UpdateHostSchedulingStatus error: ' + ex.message);
        }
    }
};
MoblabSettingsService = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [MoblabConfigurationGrpcService])
], MoblabSettingsService);
export { MoblabSettingsService };
//# sourceMappingURL=../../../app/services/moblab-settings.service.js.map