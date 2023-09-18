var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject } from '@angular/core';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
let FirmwareComponent = class FirmwareComponent {
    constructor(moblabGrpcService, dialog) {
        this.moblabGrpcService = moblabGrpcService;
        this.dialog = dialog;
        this.firmware_duts = [];
        this.firmwareDisplayedColumns = [
            'select',
            'name',
            'current_firmware',
            'updater_firmware',
        ];
        this.loading = false;
        this.selection = new SelectionModel(true, []);
    }
    ngOnInit() {
        this.getConnectedDutsFirmware();
    }
    getConnectedDutsFirmware() {
        this.loading = true;
        this.moblabGrpcService.listConnectedDutsFirmware((connectedDutsFirmware) => {
            this.firmware_duts = connectedDutsFirmware;
            this.loading = false;
        });
    }
    updateFirmware() {
        const dialogRef = this.dialog.open(FirmwareUpdateConfirmDialog);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loading = true;
                const ips = [];
                this.firmware_duts.forEach(row => {
                    if (this.selection.isSelected(row)) {
                        ips.push(row.getIp());
                    }
                });
                this.moblabGrpcService.updateFirmwareOnDuts(ips, (results) => {
                    this.loading = false;
                    const dialogRef = this.dialog.open(FirmwareUpdateResultDialog, {
                        data: results,
                    });
                    dialogRef.afterClosed().subscribe(result => {
                        this.getConnectedDutsFirmware();
                    });
                });
            }
        });
    }
    selectionChanged(event) {
        if (event.selection === 'All') {
            this.firmware_duts.forEach(row => this.selection.select(row));
        }
        else if (event.selection === 'None') {
            this.selection.clear();
        }
    }
};
FirmwareComponent = __decorate([
    Component({
        selector: 'app-firmware',
        templateUrl: './firmware.component.html',
        styleUrls: ['./firmware.component.scss'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        MatDialog])
], FirmwareComponent);
export { FirmwareComponent };
let FirmwareUpdateConfirmDialog = class FirmwareUpdateConfirmDialog {
};
FirmwareUpdateConfirmDialog = __decorate([
    Component({
        selector: 'firmware-component-confirm-dialog',
        templateUrl: 'firmware.component.confirm.dialog.html',
    })
], FirmwareUpdateConfirmDialog);
export { FirmwareUpdateConfirmDialog };
let FirmwareUpdateResultDialog = class FirmwareUpdateResultDialog {
    constructor(data) {
        this.data = data;
    }
};
FirmwareUpdateResultDialog = __decorate([
    Component({
        selector: 'firmware-component-result-dialog',
        templateUrl: 'firmware.component.result.dialog.html',
    }),
    __param(0, Inject(MAT_DIALOG_DATA)),
    __metadata("design:paramtypes", [Array])
], FirmwareUpdateResultDialog);
export { FirmwareUpdateResultDialog };
//# sourceMappingURL=../../../../app/manage-duts/firmware/firmware.component.js.map