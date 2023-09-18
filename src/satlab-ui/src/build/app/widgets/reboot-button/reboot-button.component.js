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
import { MoblabGrpcService } from '../../services/moblab-grpc.service';
import { MatDialog, } from '@angular/material/dialog';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { NotificationsService } from 'app/services/notifications.service';
let RebootButtonComponent = class RebootButtonComponent {
    constructor(dialog, moblabGrpcService, notificationsService) {
        this.dialog = dialog;
        this.moblabGrpcService = moblabGrpcService;
        this.notificationsService = notificationsService;
    }
    rebootClick() {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
            width: '500px',
            data: {
                message: 'Are you sure you would like to reboot now?',
                title: 'Reboot',
            },
        });
        const sub = dialogRef.componentInstance.onOk.subscribe(() => {
            this.rebootMoblab();
        });
    }
    rebootMoblab() {
        this.moblabGrpcService.reboot_moblab((error_message) => {
            this.notificationsService.error(error_message);
        });
    }
};
RebootButtonComponent = __decorate([
    Component({
        selector: 'app-reboot-button',
        templateUrl: './reboot-button.component.html',
    }),
    __metadata("design:paramtypes", [MatDialog,
        MoblabGrpcService,
        NotificationsService])
], RebootButtonComponent);
export { RebootButtonComponent };
//# sourceMappingURL=../../../../app/widgets/reboot-button/reboot-button.component.js.map