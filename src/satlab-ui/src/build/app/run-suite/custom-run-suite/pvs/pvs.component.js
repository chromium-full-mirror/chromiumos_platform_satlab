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
import { BaseSuite } from '../../common/base_suite/base-suite.component';
import { MoblabGrpcService } from './../../../services/moblab-grpc.service';
import { RunSuiteButtonComponent } from '../../common/run-suite-button/run-suite-button.component';
import { Router } from '@angular/router';
import { NotificationsService } from 'app/services/notifications.service';
let PvsComponent = class PvsComponent extends BaseSuite {
    constructor(changeDetector, moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.changeDetector = changeDetector;
        this.suiteList = [
            'sanity',
            'pvs-tast-cq',
            'bvt-cq',
            'bvt-inline',
            'thermal_qual_fast',
            'thermal_qual_full',
            'pvs-audio',
            'pvs-graphics',
            'pvs-video',
            'pvs-display',
            'pvs-kernel',
        ];
        this.suiteName = '';
        this.buildSelected = false;
        this.suiteSelected = false;
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterViewInit() {
        this.changeDetector.detectChanges();
    }
    /** Method triggered on change of suite input form.
     * */
    suiteChanged() {
        this.suiteSelected = this.suiteName ? true : false;
        this.isReadyToRun();
    }
    /** Method triggered on change of suite input form.
     * */
    suiteDropdownChanged(suiteName) {
        this.suiteName = suiteName;
        this.suiteSelected = this.suiteName ? true : false;
        this.isReadyToRun();
    }
    isReadyToRun() {
        if (this.suiteSelected && this.buildSelected) {
            this.runSuiteButton.enable();
        }
        else {
            this.runSuiteButton.disable();
        }
    }
    /** Method triggered on complete setting of build-related arguments.
     * ( model, build-target, milestone, build-version ).
     * */
    onBuildSetCustom(event) {
        this.buildSelected = true;
        this.isReadyToRun();
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.buildSelected = false;
        this.isReadyToRun();
    }
    /** Method triggered on run-suite button press. Invokes runSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting suite run.');
        this.moblabGrpcService.runSuite(_ => {
            this.onSuiteStarted();
        }, (err, _) => {
            this.onRunSuiteFailed(err.message);
            this.isReadyToRun();
        }, this.suiteName, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool);
    }
};
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], PvsComponent.prototype, "runSuiteButton", void 0);
PvsComponent = __decorate([
    Component({
        selector: 'app-pvs',
        templateUrl: './pvs.component.html',
        styleUrls: ['./pvs.component.scss'],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        Router,
        NotificationsService])
], PvsComponent);
export { PvsComponent };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/pvs/pvs.component.js.map