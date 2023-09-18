var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { JOB_START_TIME_FROM_FILTER } from '../../../view-jobs/view-jobs.component';
import { MoblabGrpcService } from '../../../services/moblab-grpc.service';
import { normalizeTimestamp } from '../../../utils/date';
import { NotificationsService } from '../../../services/notifications.service';
export var SuiteChangeType;
(function (SuiteChangeType) {
    SuiteChangeType[SuiteChangeType["RunSuiteStart"] = 1] = "RunSuiteStart";
    SuiteChangeType[SuiteChangeType["RunSuiteFailed"] = 2] = "RunSuiteFailed";
    SuiteChangeType[SuiteChangeType["FormLoadingStart"] = 3] = "FormLoadingStart";
    SuiteChangeType[SuiteChangeType["FormLoadingFinish"] = 4] = "FormLoadingFinish";
})(SuiteChangeType || (SuiteChangeType = {}));
/**
 * Base class meant to parent all implementations of run suite logic. Contains
 * some logic that is common to all suites.
 */
let BaseSuite = class BaseSuite {
    constructor(moblabGrpcService, router, notificationsService) {
        this.moblabGrpcService = moblabGrpcService;
        this.router = router;
        this.notificationsService = notificationsService;
        this.suiteFormChange = new EventEmitter();
        this.runSuiteButtonDisabled = true;
        this.selectedBuild = '';
        this.selectedBoard = '';
        this.selectedMilestone = '';
        this.selectedModel = '';
        this.selectedPool = '';
    }
    onBuildSet(event) {
        this.selectedModel = event.model;
        this.selectedBuild = event.build;
        this.selectedMilestone = event.milestone;
        this.selectedBoard = event.board;
        this.selectedPool = event.pool;
        this.onBuildSetCustom(event);
    }
    onFormLoading(message) {
        this.suiteFormChange.emit({
            changeType: SuiteChangeType.FormLoadingStart,
            message: message,
        });
    }
    onFormLoaded() {
        this.suiteFormChange.emit({ changeType: SuiteChangeType.FormLoadingFinish });
    }
    onRunSuiteClick(message = '') {
        if (message !== '') {
            this.notificationsService.notify(message);
        }
        this.suiteFormChange.emit({ changeType: SuiteChangeType.RunSuiteStart });
    }
    onRunSuiteFailed(message = '') {
        if (message !== '') {
            this.notificationsService.error(message);
        }
        this.suiteFormChange.emit({ changeType: SuiteChangeType.RunSuiteFailed });
    }
    onSuiteStarted() {
        this.redirectToViewJobs();
    }
    redirectToViewJobs() {
        const params = {};
        params[JOB_START_TIME_FROM_FILTER] = normalizeTimestamp(new Date().setTime(new Date().getTime() - 1000 /* 1 second */));
        this.router.navigate(['/view_jobs'], { queryParams: params });
    }
    getSelectedDutHostnames(duts) {
        return duts
            .filter(dut => dut.getIsEnrolled())
            .filter(dut => {
            const sameModel = dut.getModel() === this.selectedModel;
            const sameBoard = dut.getBuildTarget() === this.selectedBoard;
            const inPool = !this.selectedPool || dut.getPoolsList().includes(this.selectedPool);
            return sameModel && sameBoard && inPool;
        })
            .map(dut => dut.getIp());
    }
};
__decorate([
    Output(),
    __metadata("design:type", Object)
], BaseSuite.prototype, "suiteFormChange", void 0);
BaseSuite = __decorate([
    Component({ template: '' }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        Router,
        NotificationsService])
], BaseSuite);
export { BaseSuite };
//# sourceMappingURL=../../../../../app/run-suite/common/base_suite/base-suite.component.js.map