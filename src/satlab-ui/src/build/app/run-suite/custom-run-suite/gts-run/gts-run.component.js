var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ChangeDetectorRef, Component, ViewChild, } from '@angular/core';
import { Router } from '@angular/router';
import { BaseSuite } from '../../common/base_suite/base-suite.component';
import { BasicTextFormComponent } from '../../common/basic-text-form/basic-text-form.component';
import { MoblabGrpcService } from './../../../services/moblab-grpc.service';
import { RunSuiteButtonComponent } from '../../common/run-suite-button/run-suite-button.component';
import { NotificationsService } from 'app/services/notifications.service';
/** Component owns logic for GTS suite run form.
 * */
let GtsRunComponent = class GtsRunComponent extends BaseSuite {
    constructor(changeDetector, moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.changeDetector = changeDetector;
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterContentInit() {
        this.modulesTextForm.disable('Please select build.');
        this.changeDetector.detectChanges();
    }
    /** Method triggered on complete setting of build-related arguments.
     * ( model, build-target, milestone, build-version ).
     * */
    onBuildSetCustom(event) {
        this.modulesTextForm.enable();
        this.runSuiteButton.enable();
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.runSuiteButton.disable();
    }
    /** Method triggered on run-suite button press. Invokes runGtsSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting GTS suite run.');
        this.moblabGrpcService.runGtsSuite(response => {
            this.onSuiteStarted();
        }, (err, response) => {
            this.onRunSuiteFailed(err.message);
            this.runSuiteButton.enable();
        }, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool, this.modulesTextForm.getCsvList());
    }
};
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], GtsRunComponent.prototype, "runSuiteButton", void 0);
__decorate([
    ViewChild(BasicTextFormComponent),
    __metadata("design:type", Object)
], GtsRunComponent.prototype, "modulesTextForm", void 0);
GtsRunComponent = __decorate([
    Component({
        selector: 'app-gts-run',
        templateUrl: './gts-run.component.html',
        styleUrls: ['./gts-run.component.css'],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        Router,
        NotificationsService])
], GtsRunComponent);
export { GtsRunComponent };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/gts-run/gts-run.component.js.map