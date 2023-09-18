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
import { SuiteChangeType } from './common/base_suite/base-suite.component';
import { LoadingOverlayComponent, LoadingOverlayStyle, } from '../widgets/loading-overlay/loading-overlay.component';
import { GlobalInfoService } from 'app/services/services.module';
let RunSuiteComponent = class RunSuiteComponent {
    constructor(globalInfo) {
        this.globalInfo = globalInfo;
    }
    onSuiteStart() {
        this.onSuiteStatusUpdate('submitting');
        this.loadingOverlay.show();
    }
    onSuiteFormChange(changeType, message = null) {
        if (changeType === SuiteChangeType.RunSuiteStart) {
            this.onSuiteStatusUpdate('submitting');
            this.loadingOverlay.show();
        }
        else if (changeType === SuiteChangeType.RunSuiteFailed) {
            this.loadingOverlay.hide();
        }
        else if (changeType === SuiteChangeType.FormLoadingStart) {
            this.loadingOverlay.updateStatus(message, LoadingOverlayStyle.Top);
        }
        else if (changeType === SuiteChangeType.FormLoadingFinish) {
            this.loadingOverlay.hide();
        }
    }
    onLoadingStart(message) {
        this.loadingOverlay.updateStatus(message, LoadingOverlayStyle.Top);
    }
    onLoadingFinish() {
        this.loadingOverlay.hide();
    }
    onSuiteStatusUpdate(current_state) {
        this.loadingOverlay.updateStatus(current_state);
    }
    isTestEnabled(feature) {
        return this.globalInfo.isFeatureEnabled(feature);
    }
};
__decorate([
    ViewChild(LoadingOverlayComponent),
    __metadata("design:type", LoadingOverlayComponent)
], RunSuiteComponent.prototype, "loadingOverlay", void 0);
RunSuiteComponent = __decorate([
    Component({
        selector: 'app-run-suite',
        templateUrl: './run-suite.component.html',
        styleUrls: ['./run-suite.component.css'],
    }),
    __metadata("design:paramtypes", [GlobalInfoService])
], RunSuiteComponent);
export { RunSuiteComponent };
//# sourceMappingURL=../../../app/run-suite/run-suite.component.js.map