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
import { Component, ViewChild } from '@angular/core';
import { LoadingOverlayComponent, LoadingOverlayStyle, } from 'app/widgets/loading-overlay/loading-overlay.component';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { SelectableItem } from 'app/run-suite/common/basic-autocomplete-selector/basic-autocomplete-selector.component';
import { build_access_request_link } from '../../constants';
export var StageBuildStatus;
(function (StageBuildStatus) {
    StageBuildStatus[StageBuildStatus["SUCCESS"] = 0] = "SUCCESS";
    StageBuildStatus[StageBuildStatus["ERROR"] = 1] = "ERROR";
})(StageBuildStatus || (StageBuildStatus = {}));
const STAGE_BUILD_SUCCESS_MESSAGE = 'Successfully staged the test build.';
const STAGE_BUILD_ERROR_MESSAGE = 'Failed to stage the test build, please try again.';
const SUCCESS_ICON = 'check_circle';
const ERROR_ICON = 'error';
export class StageBuildNotification {
    constructor(message, status, icon, cssClass) {
        this.message = message;
        this.status = status;
        this.icon = icon;
        this.cssClass = cssClass;
    }
}
const GCS_URL = 'https://console.developers.google.com/storage/';
let StageBuildDialogComponent = class StageBuildDialogComponent {
    constructor(moblabGrpcService) {
        this.moblabGrpcService = moblabGrpcService;
        this.models = [];
        this.buildTargets = [];
        this.milestones = [];
        this.buildVersions = [];
        this.accessibleModels = [];
        this.stageBuildButtonDisabled = true;
        this.selectedBuild = '';
        this.selectedBuildTarget = '';
        this.selectedMilestone = '';
        this.selectedModel = '';
        this.build_access_request_link = build_access_request_link;
    }
    ngAfterViewInit() {
        this.disableAllSelectors("Loading...");
        this.loadModels();
    }
    listAccessibleModels() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.accessibleModels = yield this.moblabGrpcService.listAccessibleModelsPromise('*');
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    loadModels() {
        return __awaiter(this, void 0, void 0, function* () {
            const message = "Loading models...";
            this.resetModels(message);
            this.updateLoadingOverlay(message);
            yield this.listAccessibleModels();
            this.hideLoadingOverlay();
            this.updateModels();
        });
    }
    resetModels(message) {
        this.models = [];
        this.modelSelector.disable(message);
        this.resetBuildTarget("Please select a model.");
    }
    updateModels() {
        const models = this.accessibleModels.map(model => model.getName()).sort();
        this.models = models.map(m => new SelectableItem(m));
        if (this.models.length === 0) {
            this.modelSelector.disable('No model found, please refresh and try again.');
        }
        else {
            this.modelSelector.enable();
        }
    }
    modelChanged(model) {
        if (model !== this.selectedModel) {
            this.stageBuildButtonDisabled = true;
            this.stageBuildNotification = null;
            this.unselectBuildTarget();
            this.selectedModel = model;
            this.loadBuildTargets();
        }
    }
    loadBuildTargets() {
        this.resetBuildTarget("Loading build targets...");
        const buioldTargets = this.accessibleModels
            .filter(e => e.getName() === this.selectedModel)[0]
            .getBuildTargetsList();
        this.buildTargets = buioldTargets.map(b => new SelectableItem(b));
        if (this.buildTargets.length === 0) {
            this.buildTargetSelector.disable('No build target found for this model.');
        }
        else {
            this.buildTargetSelector.enable();
        }
    }
    resetBuildTarget(message) {
        this.buildTargets = [];
        this.buildTargetSelector.disable(message);
        this.resetMilestones("Please select a build target.");
    }
    buildTargetChanged(buildTarget) {
        if (buildTarget !== this.selectedBuildTarget) {
            this.stageBuildButtonDisabled = true;
            this.stageBuildNotification = null;
            this.unselectMilestone();
            this.selectedBuildTarget = buildTarget;
            this.loadMilestones();
        }
    }
    loadMilestones() {
        const message = "Loading milestones...";
        this.resetMilestones(message);
        this.updateLoadingOverlay(message);
        this.moblabGrpcService.listMilestones(this.selectedBuildTarget, this.selectedModel, (milestones) => {
            this.updateMilestones(milestones);
            this.hideLoadingOverlay();
        }, (errorMessage) => {
            this.updateLoadingOverlay(errorMessage);
        });
    }
    resetMilestones(message) {
        this.milestones = [];
        this.milestoneSelector.disable(message);
        this.resetBuildVersions("Please select a milestone.");
    }
    updateMilestones(milestones) {
        this.milestones = milestones.map(m => new SelectableItem(m));
        if (this.milestones.length === 0) {
            this.milestoneSelector.disable('No milestones found for the selected model and build target.');
        }
        else {
            this.milestoneSelector.enable();
        }
    }
    milestoneChanged(milestone) {
        if (milestone !== this.selectedMilestone) {
            this.stageBuildButtonDisabled = true;
            this.stageBuildNotification = null;
            this.unselectBuildVersion();
            this.selectedMilestone = milestone;
            this.loadBuildVersions();
        }
    }
    loadBuildVersions() {
        const message = "Loading build versions...";
        this.resetBuildVersions(message);
        this.updateLoadingOverlay(message);
        this.moblabGrpcService.listBuildVersions(this.selectedBuildTarget, this.selectedModel, this.selectedMilestone, '', '', (buildVersions) => {
            this.updateBuildVersions(buildVersions);
            this.hideLoadingOverlay();
        }, (errorMessage) => {
            this.updateLoadingOverlay(errorMessage);
        });
    }
    resetBuildVersions(message) {
        this.buildVersions = [];
        this.buildSelector.disable(message);
    }
    updateBuildVersions(buildVersions) {
        this.buildVersions = buildVersions.map(v => new SelectableItem(v.version, v.status));
        if (this.buildVersions.length === 0) {
            this.buildSelector.disable('No builds found for the milestone.');
        }
        else {
            this.buildSelector.enable();
        }
    }
    buildVersionChanged(buildVersion) {
        this.selectedBuild = buildVersion;
        this.stageBuildNotification = null;
        this.stageBuildButtonDisabled = false;
    }
    stageBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            const buildId = this._formatBuildId();
            this.updateLoadingOverlay('Staging the test build...');
            this.disableAllSelectors('Waiting for the stage build.');
            try {
                const buildBucket = yield this.moblabGrpcService.stageBuildPromise(this.selectedModel, this.selectedBuildTarget, this.selectedBuild);
                this.stageBuildNotification = new StageBuildNotification(STAGE_BUILD_SUCCESS_MESSAGE, StageBuildStatus.SUCCESS, SUCCESS_ICON, 'success');
                this.buildBucketUrl = this._formatBuildBucketUrl(buildBucket);
                this.returnMessage = `Successfully staged the test build ${buildId} to gcs bucket: ${buildBucket}`;
            }
            catch (error) {
                this.stageBuildNotification = new StageBuildNotification(STAGE_BUILD_ERROR_MESSAGE, StageBuildStatus.ERROR, ERROR_ICON, 'error');
            }
            this.hideLoadingOverlay();
            this.enableAllSelectors();
        });
    }
    hideLoadingOverlay() {
        this.loadingOverlay.hide();
    }
    updateLoadingOverlay(message) {
        this.loadingOverlay.show();
        this.loadingOverlay.updateStatus(message, LoadingOverlayStyle.Top);
    }
    enableAllSelectors() {
        this.stageBuildButtonDisabled = false;
        this.modelSelector.enable();
        this.buildTargetSelector.enable();
        this.milestoneSelector.enable();
        this.buildSelector.enable();
    }
    disableAllSelectors(message) {
        this.stageBuildButtonDisabled = true;
        this.modelSelector.disable(message);
        this.buildTargetSelector.disable(message);
        this.milestoneSelector.disable(message);
        this.buildSelector.disable(message);
    }
    isStageBuildSucceeded() {
        if (!this.stageBuildNotification ||
            this.stageBuildNotification.status === StageBuildStatus.ERROR) {
            return false;
        }
        return true;
    }
    _formatBuildBucketUrl(buildBucket) {
        const buildId = this._formatBuildId();
        return (GCS_URL + `${buildBucket}/${this.selectedBuildTarget}-release/${buildId}`);
    }
    _formatBuildId() {
        return `R${this.selectedMilestone}-${this.selectedBuild}`;
    }
    unselectModel() {
        this.selectedModel = null;
        this.unselectBuildTarget();
        this.buildTargetSelector.disable("Please select a model.");
    }
    unselectBuildTarget() {
        this.selectedBuildTarget = null;
        this.buildTargetSelector.clearSelection();
        this.unselectMilestone();
        this.milestoneSelector.disable("Please select a build target.");
    }
    unselectMilestone() {
        this.selectedMilestone = null;
        this.milestoneSelector.clearSelection();
        this.unselectBuildVersion();
        this.buildSelector.disable("Please select a milestone.");
    }
    unselectBuildVersion() {
        this.selectedBuild = null;
        this.buildSelector.clearSelection();
    }
};
__decorate([
    ViewChild('modelSelector'),
    __metadata("design:type", Object)
], StageBuildDialogComponent.prototype, "modelSelector", void 0);
__decorate([
    ViewChild('buildTargetSelector'),
    __metadata("design:type", Object)
], StageBuildDialogComponent.prototype, "buildTargetSelector", void 0);
__decorate([
    ViewChild('milestoneSelector'),
    __metadata("design:type", Object)
], StageBuildDialogComponent.prototype, "milestoneSelector", void 0);
__decorate([
    ViewChild('buildSelector'),
    __metadata("design:type", Object)
], StageBuildDialogComponent.prototype, "buildSelector", void 0);
__decorate([
    ViewChild(LoadingOverlayComponent),
    __metadata("design:type", LoadingOverlayComponent)
], StageBuildDialogComponent.prototype, "loadingOverlay", void 0);
StageBuildDialogComponent = __decorate([
    Component({
        selector: 'app-stage-build-dialog',
        templateUrl: 'stage-build-dialog.component.html',
        styleUrls: ['stage-build-dialog.component.scss'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService])
], StageBuildDialogComponent);
export { StageBuildDialogComponent };
//# sourceMappingURL=../../../../app/manage-duts/stage-build-dialog/stage-build-dialog.component.js.map