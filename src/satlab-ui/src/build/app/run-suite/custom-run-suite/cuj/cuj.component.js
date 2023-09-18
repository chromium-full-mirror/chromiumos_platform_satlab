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
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { RunSuiteButtonComponent } from '../../common/run-suite-button/run-suite-button.component';
import { BasicSelectorComponent } from '../../common/basic-selector/basic-selector.component';
import { NotificationsService } from 'app/services/notifications.service';
const BASIC = 'basic';
const PLUS = 'plus';
const PREMIUM = 'premium';
const ESSENTIAL = 'essential';
const ADVANCED = 'advanced';
/** Component owns logic for CUJ suite run form.
 * */
let CUJRunComponent = class CUJRunComponent extends BaseSuite {
    constructor(moblabGrpcService, router, notificationsService) {
        super(moblabGrpcService, router, notificationsService);
        this.MANUAL_SUITE_ENTRY_DESC = '>> Enter suite name';
        this.suiteList = [
            this.MANUAL_SUITE_ENTRY_DESC,
            'performance_cuj_v2',
            'performance_cuj_quick_v2',
            'performance_cuj',
            'performance_cuj_quick',
        ];
        this.suiteName = '';
        this.suiteLabel = BASIC;
        this.cujCheckError = '';
        this.hideCustomInput = true;
        this.recommendedBuildTag = 'Spera:GoodBuild';
        this.options = [];
        this.options_v1 = [
            [BASIC, 'Basic'],
            [PLUS, 'Plus'],
            [PREMIUM, 'Premium'],
        ];
        this.options_v2 = [
            [ESSENTIAL, 'Essential'],
            [ADVANCED, 'Advanced'],
        ];
        this.errorMessage = null;
        this.labelSelectDisabled = false;
        this.duts = new Array();
        this.dutHostnames = new Array();
        this.buildSelected = false;
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterContentInit() {
        setTimeout(() => {
            this.getConnectedDuts(() => { });
            // These two enable can make the tooptips `This form is disable` disappear.
            this.suiteSelectForm.enable();
        });
    }
    /**
     * Fetches DUTs for use and label modification
     */
    getConnectedDuts(callback) {
        this.moblabGrpcService.listConnectedDuts((connectedDuts) => {
            this.duts = connectedDuts;
            callback();
        }, (message) => {
            this.duts = [];
            this.cujCheckError = message;
        });
    }
    /**
     * Add specified label to list of DUT IPs
     */
    addLabel(label, callback) {
        this.moblabGrpcService.addLabelToDuts(message => {
            this.getConnectedDuts(callback);
        }, message => {
            this.cujCheckError = message;
        }, this.dutHostnames, label);
    }
    /**
     * Remove specified label from list of DUT IPs
     */
    removeLabel(label, callback) {
        this.moblabGrpcService.removeLabelFromDuts(message => {
            this.getConnectedDuts(callback);
        }, message => {
            this.cujCheckError = message;
        }, this.dutHostnames, label);
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.buildSelected = false;
        this._isReadyToRun();
    }
    /** Method triggered on change of custom suite input form.
     * */
    suiteChanged() {
        this.suiteName = this.suiteInput.getInput().trim();
        this._isReadyToRun();
    }
    /** Method triggered on change of suite dropdown.
     * */
    suiteDropdownChanged(suiteName) {
        if (suiteName !== this.MANUAL_SUITE_ENTRY_DESC) {
            this.hideCustomInput = true;
            this.suiteInput.disable('Please select build.');
            this.suiteName = suiteName;
            this.updateLabelList();
        }
        else {
            this.hideCustomInput = false;
            this.suiteInput.enable();
            this.suiteName = this.suiteInput.getInput();
            this.options = [];
        }
        this._isReadyToRun();
    }
    /** Method to update display of label options
     * */
    updateLabelList() {
        if (this.suiteName.includes('_v2')) {
            this.options = this.options_v2;
            this.externalDisplayToggle.disable();
        }
        else {
            this.options = this.options_v1;
            this.externalDisplayToggle.enable();
        }
    }
    /** Method triggered on change of custom suite input form.
     * */
    suiteLabelChanged(suiteLabel) {
        this.suiteLabel = suiteLabel;
        this._isReadyToRun();
    }
    /** Method triggered on complete setting of build-related arguments.
     * ( model, build-target, milestone, build-version ).
     * */
    onBuildSetCustom(event) {
        this.buildSelected = true;
        this._isReadyToRun();
    }
    /**
     * Method to validate DUT label setting based on chosen suiteVersion.
     * If no suiteVersion is chosen, suite will be run using current labels.
     */
    handleDutSetupAndTriggerRunSuiute() {
        this.dutHostnames = this.getSelectedDutHostnames(this.duts);
        switch (this.suiteLabel) {
            case BASIC:
                // First remove plus label, then remove premium label and last 
                // trigger the actual suite
                this.removeLabel('plus', () => {
                    this.removeLabel('premium', () => {
                        this.triggerRunSuite();
                    });
                });
                break;
            case PLUS:
                this.addLabel('plus', () => {
                    this.removeLabel('premium', () => {
                        this.triggerRunSuite();
                    });
                });
                break;
            case PREMIUM:
                this.addLabel('plus', () => {
                    this.addLabel('premium', () => {
                        this.triggerRunSuite();
                    });
                });
                break;
            case ESSENTIAL:
                this.addLabel('essential', () => {
                    this.removeLabel('advanced', () => {
                        this.triggerRunSuite();
                    });
                });
                break;
            case ADVANCED:
                this.addLabel('advanced', () => {
                    this.removeLabel('essential', () => {
                        this.triggerRunSuite();
                    });
                });
                break;
        }
    }
    _isReadyToRun() {
        if (this.buildSelected && this._validate()) {
            this.runSuiteButton.enable();
        }
        else {
            this.runSuiteButton.disable();
        }
    }
    _validate() {
        this.reset();
        if (!this.suiteLabel) {
            this.errorMessage = 'Please select the suite label.';
            return false;
        }
        if (!this.suiteName) {
            this.errorMessage = this.hideCustomInput ? '' : 'Please input a suite name.';
            return false;
        }
        return true;
    }
    reset() {
        this.errorMessage = null;
    }
    triggerRunSuite() {
        this.moblabGrpcService.runSuite(_ => {
            this.onSuiteStarted();
        }, (err, _) => {
            this.onRunSuiteFailed(err.message);
            this.runSuiteButton.enable();
        }, this.suiteName, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool);
    }
    /** Method triggered on run-suite button press. Invokes runSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting CUJ suite run.');
        if (!this._validate()) {
            this.onFormLoaded();
            return;
        }
        // this needs to be handled differently as suite is triggered already
        if (this.externalDisplayToggle.getChecked()) {
            this.addLabel('external_display', () => {
                this.handleDutSetupAndTriggerRunSuiute();
            });
        }
        else {
            this.removeLabel('external_display', () => {
                this.handleDutSetupAndTriggerRunSuiute();
            });
        }
    }
};
__decorate([
    ViewChild('suiteInput'),
    __metadata("design:type", Object)
], CUJRunComponent.prototype, "suiteInput", void 0);
__decorate([
    ViewChild('suiteSelector'),
    __metadata("design:type", Object)
], CUJRunComponent.prototype, "suiteSelectForm", void 0);
__decorate([
    ViewChild('labelSelector'),
    __metadata("design:type", Object)
], CUJRunComponent.prototype, "labelSelectForm", void 0);
__decorate([
    ViewChild('externalDisplayToggle'),
    __metadata("design:type", Object)
], CUJRunComponent.prototype, "externalDisplayToggle", void 0);
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], CUJRunComponent.prototype, "runSuiteButton", void 0);
__decorate([
    ViewChild(BasicSelectorComponent),
    __metadata("design:type", Object)
], CUJRunComponent.prototype, "basicSelectorComponent", void 0);
CUJRunComponent = __decorate([
    Component({
        selector: 'app-cuj',
        templateUrl: './cuj.component.html',
        styleUrls: ['./cuj.component.scss'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        Router,
        NotificationsService])
], CUJRunComponent);
export { CUJRunComponent };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/cuj/cuj.component.js.map