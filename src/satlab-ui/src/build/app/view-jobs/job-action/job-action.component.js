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
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { SelectionModel } from '@angular/cdk/collections';
import { NotificationsService } from 'app/services/notifications.service';
let JobActionComponent = class JobActionComponent {
    constructor(moblabGrpcService, notificationsService) {
        this.moblabGrpcService = moblabGrpcService;
        this.notificationsService = notificationsService;
        this.actionSubmitted = new EventEmitter();
        this.jobSelections = new SelectionModel(true, []);
        this.numSelectedJobs = 0;
    }
    toggleJobSelection(element) {
        this.jobSelections.toggle(element.getJobId());
    }
    isSelected(element) {
        return (this.jobSelections.hasValue() &&
            this.jobSelections.isSelected(element.getJobId()));
    }
    selectJob(element) {
        this.jobSelections.select(element.getJobId());
    }
    selectJobs(jobs) {
        jobs.forEach(job_id => {
            this.jobSelections.select(job_id);
        });
    }
    clearSelectedJobs() {
        this.jobSelections.clear();
    }
    getNumSelectedJobs() {
        return this.jobSelections.selected.length;
    }
    doAction() {
        const jobIds = this.jobSelections.selected;
        this.moblabGrpcService.abortJobs(resultMsg => {
            this.notificationsService.notify(resultMsg);
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, jobIds);
        this.clearSelectedJobs();
        this.actionSubmitted.emit();
    }
    refresh() {
        this.clearSelectedJobs();
    }
};
__decorate([
    Output(),
    __metadata("design:type", Object)
], JobActionComponent.prototype, "actionSubmitted", void 0);
JobActionComponent = __decorate([
    Component({
        selector: 'app-job-action',
        templateUrl: './job-action.component.html',
        styleUrls: ['./job-action.component.css'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        NotificationsService])
], JobActionComponent);
export { JobActionComponent };
//# sourceMappingURL=../../../../app/view-jobs/job-action/job-action.component.js.map