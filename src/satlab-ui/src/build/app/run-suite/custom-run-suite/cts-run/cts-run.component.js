var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BaseSuite } from '../../common/base_suite/base-suite.component';
import { BasicTextFormComponent } from '../../common/basic-text-form/basic-text-form.component';
import { MoblabGrpcService } from './../../../services/moblab-grpc.service';
import { RunSuiteButtonComponent } from '../../common/run-suite-button/run-suite-button.component';
import { BasicSelectorComponent } from '../../common/basic-selector/basic-selector.component';
import { NotificationsService } from '../../../services/notifications.service';
/** Component owns logic for CTS suite run form.
 * */
let CtsRunComponent = class CtsRunComponent extends BaseSuite {
    constructor(moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.suiteList = ['cts', 'cts_hardware'];
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterContentInit() {
        setTimeout(() => {
            this.versionSelectForm.disable('Please select build.');
            this.modulesTextForm.disable('Please select build.');
        });
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.ctsVersionSelectorForm.clearSelection();
        this.ctsVersionSelectorForm.disable();
        this.runSuiteButton.disable();
    }
    /** Method triggered on change of the cts version form.
     * */
    ctsVersionChanged(suiteName) {
        this.suiteName = suiteName;
        this.runSuiteButton.enable();
    }
    /** Method triggered on complete setting of build-related arguments.
     * ( model, build-target, milestone, build-version ).
     * */
    onBuildSetCustom(event) {
        this.modulesTextForm.enable();
        this.versionSelectForm.enable();
    }
    /** Method triggered on run-suite button press. Invokes runCtsSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting CTS suite run.');
        this.moblabGrpcService.runCtsSuite(response => {
            this.onSuiteStarted();
        }, (err, response) => {
            this.onRunSuiteFailed(err.message);
            this.runSuiteButton.enable();
        }, this.suiteName, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool, this.modulesTextForm.getCsvList());
    }
};
__decorate([
    ViewChild('versionSelector'),
    __metadata("design:type", Object)
], CtsRunComponent.prototype, "versionSelectForm", void 0);
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], CtsRunComponent.prototype, "runSuiteButton", void 0);
__decorate([
    ViewChild(BasicTextFormComponent),
    __metadata("design:type", Object)
], CtsRunComponent.prototype, "modulesTextForm", void 0);
__decorate([
    ViewChild(BasicSelectorComponent),
    __metadata("design:type", Object)
], CtsRunComponent.prototype, "ctsVersionSelectorForm", void 0);
CtsRunComponent = __decorate([
    Component({
        selector: 'app-cts-run',
        templateUrl: './cts-run.component.html',
        styleUrls: ['./cts-run.component.scss'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        Router,
        NotificationsService])
], CtsRunComponent);
export { CtsRunComponent };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/cts-run/cts-run.component.js.map