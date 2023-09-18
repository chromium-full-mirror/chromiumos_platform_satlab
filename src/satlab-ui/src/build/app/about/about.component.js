var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component } from '@angular/core';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { MoblabRebootCheckService } from 'app/services/moblab-reboot-check.service';
let AboutComponent = class AboutComponent {
    constructor(moblabRpcService, rebootCheckService) {
        this.moblabRpcService = moblabRpcService;
        this.rebootCheckService = rebootCheckService;
        this.moblabReleaseVersion = '';
        this.chromeosReleaseVersion = '';
        this.chromeosReleaseTrack = '';
        this.chromeosReleaseDescription = '';
        this.moblabInstallId = '';
        this.moblabSerialNumber = '';
        this.moblabHostname = '';
        this.moblabMacAddress = '';
        this.isConnectedToInternet = false;
        this.moblabStartTime = '';
        this.moblabCpuTemperature = 0.0;
    }
    ngOnInit() {
        this.getVersionInfo();
        this.getNetworkInfo();
        this.getSystemInfo();
    }
    refreshShownVersionInfo(moblab_release_version, chromeos_release_version, chromeos_release_track, chromeos_release_description, moblab_install_id, moblab_serial_number) {
        // local setter of variables that are shown in the config UI ( not to be confused with getter/setters that commit and
        // fetch changes from actual backend. )
        this.moblabReleaseVersion = moblab_release_version;
        this.chromeosReleaseVersion = chromeos_release_version;
        this.chromeosReleaseTrack = chromeos_release_track;
        this.chromeosReleaseDescription = chromeos_release_description;
        this.moblabInstallId = moblab_install_id;
        this.moblabSerialNumber = moblab_serial_number;
    }
    getVersionInfo() {
        this.moblabRpcService.get_version_info((moblab_release_version, chromeos_release_version, chromeos_release_track, chromeos_release_description, moblab_install_id, moblab_serial_number) => {
            this.refreshShownVersionInfo(moblab_release_version, chromeos_release_version, chromeos_release_track, chromeos_release_description, moblab_install_id, moblab_serial_number);
        }, (errorMsg) => {
            console.log('Encountered failure getting version info. ', errorMsg);
        });
    }
    getNetworkInfo() {
        this.moblabRpcService.get_network_info((moblab_hostname, moblab_mac_address, is_connected) => {
            this.moblabHostname = moblab_hostname;
            this.moblabMacAddress = moblab_mac_address;
            this.isConnectedToInternet = is_connected;
        }, (errorMsg) => {
            console.log('Encountered failure getting network info. ', errorMsg);
        });
    }
    getSystemInfo() {
        this.rebootCheckService.getMoblabStartTime().then(startTime => {
            this.moblabStartTime = startTime;
        }, (errorMsg) => {
            console.log('Encountered failure getting moblab timing info. ', errorMsg);
        });
        this.moblabRpcService.get_system_info((cpu_temperature) => {
            // Restrict the temperature value to 2 decimal points only.
            this.moblabCpuTemperature = Number(cpu_temperature.toFixed(2));
        }, (errorMsg) => {
            console.log('Encountered failure getting system info. ', errorMsg);
        });
    }
};
AboutComponent = __decorate([
    Component({
        selector: 'app-about',
        templateUrl: './about.component.html',
        styleUrls: ['./about.component.scss'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        MoblabRebootCheckService])
], AboutComponent);
export { AboutComponent };
//# sourceMappingURL=../../../app/about/about.component.js.map