var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { LoadingOverlayComponent, LoadingOverlayStyle, } from 'app/widgets/loading-overlay/loading-overlay.component';
import { SelectableItem } from 'app/run-suite/common/basic-autocomplete-selector/basic-autocomplete-selector.component';
let ProvisionDialogComponent = class ProvisionDialogComponent {
    constructor(data, moblabGrpcService) {
        this.data = data;
        this.moblabGrpcService = moblabGrpcService;
        this.milestones = [];
        this.buildVersions = [];
        this.pools = [];
        this.build = { milestone: '', buildVersion: '', pool: '' };
        this.model = '';
        this.board = '';
        this.canStart = false;
    }
    ngAfterViewInit() {
        this.milestoneSelector.disable('Please select milestone.');
        this.buildSelector.disable('Please select build version.');
        this.loadPools();
    }
    loadPools() {
        const message = "Loading pools...";
        this.resetPools(message);
        this.loadingOverlay.updateStatus(message, LoadingOverlayStyle.Top);
        this.moblabGrpcService.listPools(pools => {
            pools.push('<all>');
            this.updatePools(pools);
            this.loadingOverlay.hide();
        }, errorMessage => {
            this.showErrorMessage(errorMessage);
        }, null);
    }
    resetPools(message) {
        this.pools = [];
        this.poolSelector.disable(message);
        this.resetMilestones("Please select a pool.");
    }
    updatePools(pools) {
        this.pools = pools.map(p => new SelectableItem(p));
        this.poolSelector.enable();
    }
    poolChanged(pool) {
        if (pool !== this.build.pool) {
            this.unselectMilestone();
            if (pool === '<all>') {
                pool = '';
            }
            this.build.pool = pool;
            const chosenDut = this.data.duts.find(d => { var _a; return !pool || ((_a = d.getPoolsList()) === null || _a === void 0 ? void 0 : _a.includes(pool)); });
            this.model = chosenDut.getModel();
            this.board = chosenDut.getBuildTarget();
            this.loadMilestones();
        }
    }
    loadMilestones() {
        const message = "Loading milestones...";
        this.resetMilestones(message);
        this.loadingOverlay.updateStatus(message, LoadingOverlayStyle.Top);
        this.moblabGrpcService.listMilestones(this.board, this.model, (milestones, _) => {
            this.updateMilestones(milestones);
            this.loadingOverlay.hide();
        }, errorMessage => {
            this.showErrorMessage(errorMessage);
        });
    }
    resetMilestones(message) {
        this.milestones = [];
        this.milestoneSelector.disable(message);
        this.resetBuildVersions("Please select a milestone.");
    }
    updateMilestones(newMilestones) {
        this.milestones = newMilestones.map(m => new SelectableItem(m));
        if (this.milestones.length === 0) {
            this.milestoneSelector.disable('No milestones found for the model.');
        }
        else {
            this.milestoneSelector.enable();
        }
    }
    milestoneChanged(milestone) {
        if (milestone !== this.build.milestone) {
            this.unselectBuildVersion();
            this.build.milestone = milestone;
            this.loadBuildVersions();
        }
    }
    loadBuildVersions() {
        const message = "Loading build version...";
        this.resetBuildVersions(message);
        this.loadingOverlay.updateStatus(message, LoadingOverlayStyle.Top);
        this.moblabGrpcService.listBuildVersions(this.board, this.model, this.build.milestone, '', '', (buildVersions, _) => {
            this.updateBuildVersions(buildVersions);
            this.loadingOverlay.hide();
        }, errorMessage => {
            this.showErrorMessage(errorMessage);
        });
    }
    resetBuildVersions(message) {
        this.buildVersions = [];
        this.buildSelector.disable(message);
        this.canStart = false;
    }
    updateBuildVersions(newBuildVersions) {
        this.buildVersions = newBuildVersions.map(v => new SelectableItem(v.version, v.status));
        if (this.buildVersions.length === 0) {
            this.buildSelector.disable('No builds found for the milestone.');
        }
        else {
            this.buildSelector.enable();
        }
    }
    buildVersionChanged(buildVersion) {
        this.build.buildVersion = buildVersion;
        this.canStart = true;
    }
    showErrorMessage(message) {
        this.loadingOverlay.updateStatus(message, LoadingOverlayStyle.Top);
    }
    unselectMilestone() {
        this.build.milestone = null;
        this.milestoneSelector.clearSelection();
        this.unselectBuildVersion();
        this.buildSelector.disable('Please select milestone.');
    }
    unselectBuildVersion() {
        this.build.buildVersion = null;
        this.buildSelector.clearSelection();
    }
};
__decorate([
    ViewChild('buildSelector'),
    __metadata("design:type", Object)
], ProvisionDialogComponent.prototype, "buildSelector", void 0);
__decorate([
    ViewChild('milestoneSelector'),
    __metadata("design:type", Object)
], ProvisionDialogComponent.prototype, "milestoneSelector", void 0);
__decorate([
    ViewChild('poolSelector'),
    __metadata("design:type", Object)
], ProvisionDialogComponent.prototype, "poolSelector", void 0);
__decorate([
    ViewChild(LoadingOverlayComponent),
    __metadata("design:type", LoadingOverlayComponent)
], ProvisionDialogComponent.prototype, "loadingOverlay", void 0);
ProvisionDialogComponent = __decorate([
    Component({
        selector: 'app-provision-dialog',
        templateUrl: 'provision-dialog.component.html',
        styleUrls: ['provision-dialog.component.scss'],
    }),
    __param(0, Inject(MAT_DIALOG_DATA)),
    __metadata("design:paramtypes", [Object, MoblabGrpcService])
], ProvisionDialogComponent);
export { ProvisionDialogComponent };
//# sourceMappingURL=../../../../app/manage-duts/provision-dialog/provision-dialog.component.js.map