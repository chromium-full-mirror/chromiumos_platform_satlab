var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
var UIState;
(function (UIState) {
    UIState[UIState["NEEDS_SETUP"] = 1] = "NEEDS_SETUP";
    UIState[UIState["SETUP_COMPLETE"] = 2] = "SETUP_COMPLETE";
    UIState[UIState["NO_DUTS_CONFIGURED"] = 3] = "NO_DUTS_CONFIGURED";
})(UIState || (UIState = {}));
export var Feature;
(function (Feature) {
    Feature[Feature["VIEW_JOBS"] = 1] = "VIEW_JOBS";
    Feature[Feature["RUN_CTS"] = 2] = "RUN_CTS";
    Feature[Feature["RUN_STORAGE_QUAL"] = 3] = "RUN_STORAGE_QUAL";
    Feature[Feature["RUN_MEMORY_QUAL"] = 4] = "RUN_MEMORY_QUAL";
    Feature[Feature["RUN_BOARD_QUAL"] = 5] = "RUN_BOARD_QUAL";
    Feature[Feature["RUN_FSI"] = 6] = "RUN_FSI";
    Feature[Feature["RUN_TESTS"] = 7] = "RUN_TESTS";
    Feature[Feature["RUN_POWER"] = 8] = "RUN_POWER";
    Feature[Feature["DUT_MANAGEMENT"] = 9] = "DUT_MANAGEMENT";
    Feature[Feature["SYSTEM_CONFIGURATION"] = 10] = "SYSTEM_CONFIGURATION";
    Feature[Feature["ADVANCED_SETTINGS"] = 11] = "ADVANCED_SETTINGS";
    Feature[Feature["REPORT_A_PROBLEM"] = 12] = "REPORT_A_PROBLEM";
    Feature[Feature["MOBMONITOR"] = 13] = "MOBMONITOR";
    Feature[Feature["DOCUMENTATION"] = 14] = "DOCUMENTATION";
    Feature[Feature["FEEDBACK_REPORTS"] = 15] = "FEEDBACK_REPORTS";
    Feature[Feature["TOOLBAR_PAGE_INFORMATION"] = 16] = "TOOLBAR_PAGE_INFORMATION";
    Feature[Feature["JOB_DETAIL"] = 17] = "JOB_DETAIL";
    Feature[Feature["DUT_DETAIL"] = 18] = "DUT_DETAIL";
    Feature[Feature["ABOUT"] = 19] = "ABOUT";
})(Feature || (Feature = {}));
let GlobalInfoService = class GlobalInfoService {
    constructor() {
        this.enabledFeatures = [
            Feature.DUT_MANAGEMENT,
            Feature.FEEDBACK_REPORTS,
            Feature.RUN_TESTS,
            Feature.VIEW_JOBS,
            Feature.JOB_DETAIL,
            Feature.DUT_DETAIL,
            Feature.SYSTEM_CONFIGURATION,
            Feature.ABOUT,
        ];
        this.enableNavBarSubject = new BehaviorSubject(true);
        this.enableNavBarObservable = this.enableNavBarSubject.asObservable();
    }
    setEnableNavBar(enableNavBar) {
        this.enableNavBarSubject.next(enableNavBar);
    }
    getUIState() {
        return UIState.NEEDS_SETUP;
    }
    isFeatureEnabled(f) {
        return this.enabledFeatures.indexOf(f) > -1;
    }
    enableFeature(f) {
        return this.enabledFeatures.push(f);
    }
    disableFeature(f) {
        const index = this.enabledFeatures.indexOf(f, 0);
        if (index > -1) {
            this.enabledFeatures.splice(index, 1);
        }
    }
};
GlobalInfoService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], GlobalInfoService);
export { GlobalInfoService };
//# sourceMappingURL=../../../app/services/global-ui-settings.service.js.map