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
import { BaseSuite } from '../common/base_suite/base-suite.component';
import { MoblabGrpcService } from './../../services/moblab-grpc.service';
import { RunSuiteButtonComponent } from '../common/run-suite-button/run-suite-button.component';
import { NotificationsService } from 'app/services/notifications.service';
/** Component owns logic for run-any-suite form. This component allows for the
 *  execution of any runnable suite, but without custom arguments.
 * */
let RunAnySuiteComponent = class RunAnySuiteComponent extends BaseSuite {
    constructor(changeDetector, moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.changeDetector = changeDetector;
        this.MANUAL_SUITE_ENTRY_DESC = '>> Enter suite name';
        this.suiteList = [
            this.MANUAL_SUITE_ENTRY_DESC,
            'au_fsi',
            'bvt-cq',
            'bvt-inline',
            'bvt-tast-cq',
            'camera-usb-qual',
            'wifi_matfunc',
            'wifi_perf',
            'labqual',
            'thermal_qual_fast',
            'thermal_qual_full',
            'performance_cuj_v2',
            'performance_cuj_quick_v2',
            'performance_cuj',
            'performance_cuj_quick',
            'mtbf',
        ];
        this.hideCustomInput = true;
        this.suiteName = '';
        this.buildSelected = false;
        this.suiteSelected = false;
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterViewInit() {
        this.suiteInput.disable('Please select build.');
        this.changeDetector.detectChanges();
    }
    /** Method triggered on change of suite input form.
     * */
    suiteChanged() {
        this.suiteName = this.suiteInput.getInput();
        this.suiteSelected = this.suiteName ? true : false;
        this.isReadyToRun();
    }
    /** Method triggered on change of suite input form.
     * */
    suiteDropdownChanged(suiteName) {
        if (suiteName !== this.MANUAL_SUITE_ENTRY_DESC) {
            this.hideCustomInput = true;
            this.suiteInput.disable('Please select build.');
            this.suiteName = suiteName;
        }
        else {
            this.hideCustomInput = false;
            this.suiteInput.enable();
            this.suiteName = this.suiteInput.getInput();
        }
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
        this.suiteInput.enable();
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
    ViewChild('suiteInput'),
    __metadata("design:type", Object)
], RunAnySuiteComponent.prototype, "suiteInput", void 0);
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], RunAnySuiteComponent.prototype, "runSuiteButton", void 0);
RunAnySuiteComponent = __decorate([
    Component({
        selector: 'app-run-any-suite',
        templateUrl: './run-any-suite.component.html',
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        Router,
        NotificationsService])
], RunAnySuiteComponent);
export { RunAnySuiteComponent };
//# sourceMappingURL=../../../../app/run-suite/run-any-suite/run-any-suite.component.js.map