var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BaseSuite } from '../../common/base_suite/base-suite.component';
import { MoblabGrpcService } from '../../../services/moblab-grpc.service';
import { RunSuiteButtonComponent } from '../../common/run-suite-button/run-suite-button.component';
import { NotificationsService } from '../../../services/notifications.service';
import { BuildTargetAccessService } from '../../../services/build-target-access.service';
import { SelectableItem } from "../../common/basic-autocomplete-selector/basic-autocomplete-selector.component";
/** Component owns logic for fwupd form. This component allows for the
 *  execution of any runnable suite, but without custom arguments.
 * */
let FWUPDRunComponent = class FWUPDRunComponent extends BaseSuite {
    constructor(changeDetector, moblabGrpcService, router, notificationsService, buildTargetAccessService) {
        super(moblabGrpcService, router, notificationsService);
        this.changeDetector = changeDetector;
        this.buildTargetAccessService = buildTargetAccessService;
        this.FWUPD_UPDATE = 'fwupd_update';
        this.FWUPD_DOWNGRADE = 'fwupd_downgrade';
        this.FWUPD_INSTALL_VERSION = 'fwupd_install_version';
        this.FWUPD_INSTALL_FILE = 'fwupd_install_file';
        this.test_args = [];
        this.dutIPs = [];
        this.suiteList = [
            this.FWUPD_UPDATE,
            this.FWUPD_DOWNGRADE,
            this.FWUPD_INSTALL_VERSION,
            this.FWUPD_INSTALL_FILE
        ];
        this.suiteName = '';
        this.suiteSelected = false;
        this.buildSelected = false;
        this.dut_IP = '';
        this.data = [];
        this.device_id = null;
        this.device = null;
        this.device_file_or_version = null;
        this.peripheral_error = false;
    }
    /** Sets initial form enable/disable states.
     * */
    ngAfterViewInit() {
        this.changeDetector.detectChanges();
        this.suiteSelectForm.disable('Please select DUT');
        this.dutSelectForm.disable('Please select build');
    }
    getConnectedDuts() {
        this.onFormLoading("fetching DUT IPs...");
        this.moblabGrpcService.listConnectedDuts((connectedDuts) => {
            this.dutIPs = this.getSelectedDutHostnames(connectedDuts);
            this.onFormLoaded();
        }, (message) => {
            this.dutIPs = [];
            this.onRunSuiteFailed(message);
            this.onFormLoaded();
        });
    }
    /** Method triggered on change of suite input.
     * */
    suiteDropdownChanged(suiteName) {
        this.suiteName = suiteName;
        this.suiteSelected = true;
        this.resetDeviceInput();
        this.isReadyToRun();
    }
    /** Method checking the `string` is empty or null. */
    checkIsEmpty(s) {
        return s === null || (s && s.trim() === '');
    }
    /** Method triggered on change of suite input and dut ip */
    resetDeviceInput() {
        var _a, _b;
        (_a = this.deviceIdSelector) === null || _a === void 0 ? void 0 : _a.clearSelection();
        (_b = this.deviceInput) === null || _b === void 0 ? void 0 : _b.clear();
        this.device = null;
    }
    /** Method triggered on changing of device id **/
    deviceIdChanged(event) {
        this.device_id = event.value;
        if (this.peripherals_info_json['Devices'] !== null) {
            this.device = this.getDeviceBy(this.device_id);
        }
        this.isReadyToRun();
    }
    /** Method triggered on changing of device version or file **/
    deviceInputChanged() {
        var _a, _b;
        this.device_file_or_version = (_b = (_a = this.deviceInput) === null || _a === void 0 ? void 0 : _a.getInput()) === null || _b === void 0 ? void 0 : _b.trim();
        this.isReadyToRun();
    }
    /** Method triggered on change of DUT IP input.
     * */
    dutIPDropdownChanged(dut_ip) {
        this.dut_IP = dut_ip;
        this.data = [];
        this.peripheral_error = false;
        this.peripherals_info_json = null;
        this.resetDeviceInput();
        this.onFormLoading("fetching devices...");
        this.moblabGrpcService.getPeripheralInformation(dut_ip, (response) => {
            console.log('successfully got the result back with response:');
            console.log(response.getJsonInfo());
            this.peripherals_info_json = JSON.parse(response.getJsonInfo());
            if (this.peripherals_info_json['Devices'] !== null) {
                this.data = this.peripherals_info_json['Devices'].map(device => {
                    return new SelectableItem(`${device.Name}`, device.Flags.includes('updatable') ? '' : '(not-updatable)', `${device.DeviceId}`);
                });
            }
            this.onFormLoaded();
            this.suiteSelectForm.enable();
        }, (message) => {
            this.onFormLoaded();
            this.peripheral_error = true;
        });
    }
    refresh_peripheral_information() {
        if (this.dut_IP) {
            this.dutIPDropdownChanged(this.dut_IP);
        }
    }
    isReadyToRun() {
        const isDeviceSelected = !this.checkIsEmpty(this.device_id);
        let isDeviceValid = false;
        switch (this.suiteName) {
            case this.FWUPD_UPDATE:
            case this.FWUPD_DOWNGRADE:
                isDeviceValid = isDeviceSelected;
                break;
            case this.FWUPD_INSTALL_VERSION:
            case this.FWUPD_INSTALL_FILE:
                isDeviceValid = isDeviceSelected && !this.checkIsEmpty(this.device_file_or_version);
                break;
        }
        if (this.suiteSelected && this.buildSelected && isDeviceValid) {
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
        this.dutSelectForm.enable();
        this.getConnectedDuts();
        this.isReadyToRun();
    }
    /** Method is triggered when build version form no longer has a valid
     * build version selected.
     * */
    onBuildVersionUnselected() {
        this.buildSelected = false;
        this.isReadyToRun();
    }
    /** Method to get the device */
    getDeviceBy(device_id) {
        var _a;
        return (_a = this.peripherals_info_json['Devices']
            .find(device => device.DeviceId === device_id)) !== null && _a !== void 0 ? _a : null;
    }
    /** Method is getting the `test_args` **/
    getTestArgs() {
        var _a, _b, _c;
        let id = ((_b = (_a = this.device) === null || _a === void 0 ? void 0 : _a.Guid[0]) !== null && _b !== void 0 ? _b : (_c = this.getDeviceBy(this.device_id)) === null || _c === void 0 ? void 0 : _c.Guid[0]) || this.device_id;
        return [
            `device_id=${id}`,
            ...(this.suiteName === this.FWUPD_INSTALL_VERSION) ? [`version=${this.device_file_or_version}`] : [],
            ...(this.suiteName === this.FWUPD_INSTALL_FILE) ? [`fwfile=${this.device_file_or_version}`] : [],
        ];
    }
    /** Method triggered on run-suite button press. Invokes runSuite RPC call.
     * */
    onRunSuiteClick() {
        super.onRunSuiteClick('Starting suite run.');
        this.moblabGrpcService.runFWUPDSuite(_ => {
            this.onSuiteStarted();
        }, (err, _) => {
            this.onRunSuiteFailed(err.message);
            this.isReadyToRun();
        }, this.suiteName, this.selectedBuild, this.selectedMilestone, this.selectedBoard, this.selectedModel, this.selectedPool, this.getTestArgs());
    }
};
__decorate([
    ViewChild('suiteSelector'),
    __metadata("design:type", Object)
], FWUPDRunComponent.prototype, "suiteSelectForm", void 0);
__decorate([
    ViewChild('dutSelector'),
    __metadata("design:type", Object)
], FWUPDRunComponent.prototype, "dutSelectForm", void 0);
__decorate([
    ViewChild('deviceIdSelector'),
    __metadata("design:type", Object)
], FWUPDRunComponent.prototype, "deviceIdSelector", void 0);
__decorate([
    ViewChild('deviceInput'),
    __metadata("design:type", Object)
], FWUPDRunComponent.prototype, "deviceInput", void 0);
__decorate([
    ViewChild(RunSuiteButtonComponent),
    __metadata("design:type", Object)
], FWUPDRunComponent.prototype, "runSuiteButton", void 0);
FWUPDRunComponent = __decorate([
    Component({
        selector: 'app-fwupd',
        templateUrl: './fwupd.component.html',
        styleUrls: ['./fwupd.component.scss'],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        Router,
        NotificationsService,
        BuildTargetAccessService])
], FWUPDRunComponent);
export { FWUPDRunComponent };
//# sourceMappingURL=../../../../../app/run-suite/custom-run-suite/fwupd/fwupd.component.js.map