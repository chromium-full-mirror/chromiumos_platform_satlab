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
/** Component owns logic for hardware memory qualification suite run form.
 * */
let MemoryQualComponent = class MemoryQualComponent extends BaseSuite {
    constructor(changeDetector, moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.changeDetector = changeDetector;
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterViewInit() {
        this.bugIdInput.disable('Please select build.');
        this.partNumberInput.disable('Please select build.');
        this.changeDetector.detectChanges();
    }
    /** Method triggered on complete setting of build-related arguments.
     * ( model, build-target, milestone, build-version ).
     * */
    onBuildSetCustom(event) {
        this.bugIdInput.enable();
        this.partNumberInput.enable();
    }
    /** Method triggered on change of either bug ID or part number.
     * */
    avlInputChanged() {
        if (this.bugIdInput.getInput() && this.partNumberInput.getInput()) {
            this.runSuiteButton.enable();
        }
        else {
            this.runSuiteButton.disable();
        }
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.runSuiteButton.disable();
    }
    /** Method triggered on run-suite button press. Invokes
     *  runMemoryQualificationSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting memory qualification suite run.');
        this.moblabGrpcService.runMemoryQualificationSuite(response => {
            this.onSuiteStarted();
        }, (err, response) => {
            this.onRunSuiteFailed(err.message);
            this.runSuiteButton.enable();
        }, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool, this.bugIdInput.getInput(), this.partNumberInput.getInput());
    }
};
__decorate([
    ViewChild('bugIdInput'),
    __metadata("design:type", Object)
], MemoryQualComponent.prototype, "bugIdInput", void 0);
__decorate([
    ViewChild('partNumberInput'),
    __metadata("design:type", Object)
], MemoryQualComponent.prototype, "partNumberInput", void 0);
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], MemoryQualComponent.prototype, "runSuiteButton", void 0);
MemoryQualComponent = __decorate([
    Component({
        selector: 'app-memory-qual',
        templateUrl: './memory-qual.component.html',
        styleUrls: ['./memory-qual.component.scss'],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        Router,
        NotificationsService])
], MemoryQualComponent);
export { MemoryQualComponent };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/memory-qual/memory-qual.component.js.map