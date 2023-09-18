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
import { RunStorageQualificationSuiteRequest } from '../../../services/moblabrpc_pb';
import { NotificationsService } from 'app/services/notifications.service';
let StorageQualComponent = class StorageQualComponent extends BaseSuite {
    constructor(changeDetector, moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.changeDetector = changeDetector;
        this.variationOptions = [''].concat(Object.keys(RunStorageQualificationSuiteRequest.Variation).slice(1, 3));
        this.variationSelection = 0;
        this.isStorageQualSetupValid = false;
        this.storageQualCheckError = '';
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterViewInit() {
        this.bugIdInput.disable('Please select build.');
        this.partNumberInput.disable('Please select build.');
        this.changeDetector.detectChanges();
    }
    onBuildSetCustom(event) {
        this.bugIdInput.enable();
        this.partNumberInput.enable();
    }
    /** Method triggered on change of either bug ID or part number.
     * */
    inputChanged() {
        if (this.bugIdInput.getInput() &&
            this.partNumberInput.getInput() &&
            this.isStorageQualSetupValid) {
            this.runSuiteButton.enable();
        }
        else {
            this.runSuiteButton.disable();
        }
    }
    /** Method triggered on change of variation selector
     * */
    variationChanged(newVariation) {
        this.variationSelection = newVariation
            ? Number(RunStorageQualificationSuiteRequest.Variation[newVariation])
            : 0;
        this.validateStorageQualSetup();
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.runSuiteButton.disable();
    }
    /** Method triggered on run-suite button press. Invokes
     *  runStorageQualificationSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting storage qualification suite run.');
        this.moblabGrpcService.runStorageQualificationSuite(response => {
            this.onSuiteStarted();
        }, (err, response) => {
            this.onRunSuiteFailed(err.message);
            this.runSuiteButton.enable();
        }, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool, this.bugIdInput.getInput(), this.partNumberInput.getInput(), this.variationSelection, 0, // Disk size in GB.
        false, // Test dual namespace devices.
        false // this feature is not available in v1 version of storage_qual
        );
    }
    validateStorageQualSetup() {
        this.storageQualCheckError = '';
        this.isStorageQualSetupValid = false;
        this.inputChanged();
        const variationsToCheck = [
            RunStorageQualificationSuiteRequest.Variation.VARIATION_NOT_SET,
            RunStorageQualificationSuiteRequest.Variation.QUICK,
        ];
        if (!variationsToCheck.includes(this.variationSelection)) {
            this.isStorageQualSetupValid = true;
            this.inputChanged();
            return;
        }
        this.onFormLoading('validating storage qual setup ...');
        this.moblabGrpcService.validateStorageQualSetup(() => {
            this.isStorageQualSetupValid = true;
            this.storageQualCheckError = '';
            this.inputChanged();
            this.onFormLoaded();
        }, (msg) => {
            this.storageQualCheckError = msg;
            this.inputChanged();
            this.onFormLoaded();
        }, this.selectedModel, this.selectedBoard, this.selectedPool);
    }
};
__decorate([
    ViewChild('bugIdInput'),
    __metadata("design:type", Object)
], StorageQualComponent.prototype, "bugIdInput", void 0);
__decorate([
    ViewChild('partNumberInput'),
    __metadata("design:type", Object)
], StorageQualComponent.prototype, "partNumberInput", void 0);
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], StorageQualComponent.prototype, "runSuiteButton", void 0);
StorageQualComponent = __decorate([
    Component({
        selector: 'app-storage-qual',
        templateUrl: './storage-qual.component.html',
        styleUrls: ['./storage-qual.component.scss'],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        Router,
        NotificationsService])
], StorageQualComponent);
export { StorageQualComponent };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/storage-qual/storage-qual.component.js.map