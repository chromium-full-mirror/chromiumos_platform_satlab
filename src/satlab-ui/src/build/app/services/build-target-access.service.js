var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { NotificationsService } from 'app/services/notifications.service';
let BuildTargetAccessService = class BuildTargetAccessService {
    constructor(moblabGrpcService, notificationsService) {
        this.moblabGrpcService = moblabGrpcService;
        this.notificationsService = notificationsService;
        this.buildTargets = [];
        this.modelsWithoutAccessSubject = new BehaviorSubject([]);
        this.buildTargetSubject = new BehaviorSubject([]);
        this.modelsWithoutAccessObservable = this.modelsWithoutAccessSubject.asObservable();
        this.buildTargetsObservable = this.buildTargetSubject.asObservable();
        this.initModelsWithoutAccess();
    }
    updateModelsWithoutAccess(connectedDuts) {
        if (this.buildTargets.length === 0) {
            return;
        }
        const enrolledDuts = connectedDuts.filter(connectedDut => connectedDut.getIsEnrolled());
        const modelsWithoutAccess = enrolledDuts
            .filter(dut => !this.buildTargets.includes(dut.getBuildTarget()))
            .map(dut => dut.getModel());
        this.modelsWithoutAccessSubject.next([...new Set(modelsWithoutAccess)]);
    }
    initModelsWithoutAccess() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getBuildTargets();
            this.getConnectedDuts();
        });
    }
    getBuildTargets() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.buildTargets = yield this.moblabGrpcService.listBuildTargetsPromise();
                this.buildTargetSubject.next(this.buildTargets);
            }
            catch (error) {
                this.notificationsService.error(error.message);
            }
        });
    }
    getConnectedDuts() {
        this.moblabGrpcService.listConnectedDuts((connectedDuts) => {
            this.updateModelsWithoutAccess(connectedDuts);
        }, (message) => {
            this.notificationsService.error(message);
        });
    }
};
BuildTargetAccessService = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        NotificationsService])
], BuildTargetAccessService);
export { BuildTargetAccessService };
//# sourceMappingURL=../../../app/services/build-target-access.service.js.map