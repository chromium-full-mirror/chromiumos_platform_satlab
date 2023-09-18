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
import { BaseSuite, } from '../../common/base_suite/base-suite.component';
import { MoblabGrpcService } from './../../../services/moblab-grpc.service';
import { RunSuiteButtonComponent } from '../../common/run-suite-button/run-suite-button.component';
import { Router } from '@angular/router';
import { RunStorageQualificationSuiteRequest } from '../../../services/moblabrpc_pb';
import { NotificationsService } from 'app/services/notifications.service';
let StorageQualV2Component = class StorageQualV2Component extends BaseSuite {
    constructor(changeDetector, moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.changeDetector = changeDetector;
        this.suiteOptions = [
            'Quick test',
            'Extra short test (2 testing blocks)',
            'Short test (10 testing blocks)',
            'Medium test (20 testing blocks)',
            'Long test (30 testing blocks)',
            'Extra long test (40 testing blocks)',
        ];
        this.suiteIndex = 0; // Index of currently seleted suite.
        this.isStorageQualSetupValid = false;
        this.storageQualCheckError = '';
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterViewInit() {
        this.disableTestParamControls();
        this.bugIdInput.disable('Please select disk size.');
        this.partNumberInput.disable('Please select disk size.');
        this.changeDetector.detectChanges();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBuildSetCustom() {
        this.diskSizeInput.enable();
        this.suiteSelector.enable();
        this.dualNamespace.enable();
        this.isPreQualified.enable();
    }
    diskInputChanged() {
        if (this.diskSizeInput.getInput()) {
            this.suiteSelector.selectOption(5);
            this.bugIdInput.enable();
            this.partNumberInput.enable();
        }
    }
    /** Method triggered on change of either bug ID or part number.
     * */
    avlInputChanged() {
        if (this.bugIdInput.getInput() && this.partNumberInput.getInput() && this.isStorageQualSetupValid) {
            this.runSuiteButton.enable();
        }
        else {
            this.runSuiteButton.disable();
        }
    }
    /** Method triggered on change of variation selector
     * */
    suiteChanged(newSuite) {
        this.suiteIndex = newSuite ? this.suiteOptions.indexOf(newSuite) : 0;
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.disableTestParamControls();
        this.runSuiteButton.disable();
    }
    disableTestParamControls() {
        this.diskSizeInput.disable('Please select build.');
        this.suiteSelector.disable('Please select build.');
        this.dualNamespace.disable('Please select build.');
        this.isPreQualified.disable('Please select build.');
    }
    /** Method triggered on run-suite button press. Invokes
     *  runStorageQualificationSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting storage qualification suite run.');
        this.moblabGrpcService.runStorageQualificationSuite(_response => {
            this.onSuiteStarted();
        }, (err, _response) => {
            this.onRunSuiteFailed(err.message);
            this.runSuiteButton.enable();
        }, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool, this.bugIdInput.getInput(), this.partNumberInput.getInput(), this.suiteIndex +
            Number(RunStorageQualificationSuiteRequest.Variation.QUICK_V2), this.diskSizeInput.getInput(), this.dualNamespace.getChecked(), this.isPreQualified.getChecked());
    }
    validateStorageQualSetup() {
        this.storageQualCheckError = '';
        this.isStorageQualSetupValid = false;
        this.avlInputChanged();
        const variationsToCheck = [
            RunStorageQualificationSuiteRequest.Variation.QUICK_V2,
            RunStorageQualificationSuiteRequest.Variation.XS,
            RunStorageQualificationSuiteRequest.Variation.S,
            RunStorageQualificationSuiteRequest.Variation.M,
            RunStorageQualificationSuiteRequest.Variation.L,
            RunStorageQualificationSuiteRequest.Variation.XL,
        ];
        const variation = this.suiteIndex + Number(RunStorageQualificationSuiteRequest.Variation.QUICK_V2);
        if (!variationsToCheck.includes(variation)) {
            this.isStorageQualSetupValid = true;
            return;
        }
        this.onFormLoading('validating storage qual setup ...');
        this.moblabGrpcService.validateStorageQualSetup(() => {
            this.isStorageQualSetupValid = true;
            this.storageQualCheckError = '';
            this.avlInputChanged();
            this.onFormLoaded();
        }, (msg) => {
            this.storageQualCheckError = msg;
            this.avlInputChanged();
            this.onFormLoaded();
        }, this.selectedModel, this.selectedBoard, this.selectedPool);
    }
};
__decorate([
    ViewChild('bugIdInput'),
    __metadata("design:type", Object)
], StorageQualV2Component.prototype, "bugIdInput", void 0);
__decorate([
    ViewChild('partNumberInput'),
    __metadata("design:type", Object)
], StorageQualV2Component.prototype, "partNumberInput", void 0);
__decorate([
    ViewChild('diskSizeInput'),
    __metadata("design:type", Object)
], StorageQualV2Component.prototype, "diskSizeInput", void 0);
__decorate([
    ViewChild('suiteSelector'),
    __metadata("design:type", Object)
], StorageQualV2Component.prototype, "suiteSelector", void 0);
__decorate([
    ViewChild('dualNamespace'),
    __metadata("design:type", Object)
], StorageQualV2Component.prototype, "dualNamespace", void 0);
__decorate([
    ViewChild('isPreQualified'),
    __metadata("design:type", Object)
], StorageQualV2Component.prototype, "isPreQualified", void 0);
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], StorageQualV2Component.prototype, "runSuiteButton", void 0);
StorageQualV2Component = __decorate([
    Component({
        selector: 'app-storage-qual-v2',
        templateUrl: './storage-qual-v2.component.html',
        styleUrls: ['./storage-qual-v2.component.scss'],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        Router,
        NotificationsService])
], StorageQualV2Component);
export { StorageQualV2Component };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/storage-qual-v2/storage-qual-v2.component.js.map