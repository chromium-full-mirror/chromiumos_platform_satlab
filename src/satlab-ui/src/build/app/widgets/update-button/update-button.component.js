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
import { MoblabGrpcService } from '../../services/moblab-grpc.service';
import { MatDialog } from '@angular/material/dialog';
import { ButtonWithProgressComponent } from '../button-with-progress/button-with-progress.component';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog.component';
import { NotificationsService } from 'app/services/notifications.service';
let UpdateButtonComponent = class UpdateButtonComponent {
    constructor(moblabGrpcService, dialog, notificationsService) {
        this.moblabGrpcService = moblabGrpcService;
        this.dialog = dialog;
        this.notificationsService = notificationsService;
        this.isUpdateAvailable = false;
        this.getUpdateStatusFailed = false;
    }
    ngOnInit() {
        this.moblabGrpcService.get_is_update_available((is_update_available) => {
            this.isUpdateAvailable = is_update_available;
        }, (msg) => {
            this.getUpdateStatusFailed = true;
            this.notificationsService.error(msg);
        });
    }
    getUpdateStatusMessage() {
        if (this.getUpdateStatusFailed) {
            return 'Failed to get update status.';
        }
        else if (this.isUpdateAvailable) {
            return 'An update is available!';
        }
        else {
            return 'No updates found.';
        }
    }
    updateClick() {
        const dialogRef = this.dialog.open(ConfirmationDialog, {
            width: '500px',
            data: {
                message: 'This software update will take 1-2 mins. Please ensure ' +
                    'no tests are running before the update. Would you like to proceed?',
                title: 'Update Confirmation',
            },
        });
        dialogRef.componentInstance.onOk.subscribe(() => {
            this.updateMoblab();
        });
    }
    updateMoblab() {
        this.updateButton.setIsLoadingStatus(true);
        this.moblabGrpcService.update_moblab((message) => {
            this.updateButton.setIsLoadingStatus(false);
            this.notificationsService.notify(message);
        }, (error_message) => {
            this.updateButton.setIsLoadingStatus(false);
            this.notificationsService.error(error_message);
        });
    }
};
__decorate([
    ViewChild('updateBUtton'),
    __metadata("design:type", ButtonWithProgressComponent)
], UpdateButtonComponent.prototype, "updateButton", void 0);
UpdateButtonComponent = __decorate([
    Component({
        selector: 'app-update-button',
        templateUrl: './update-button.component.html',
        styleUrls: ['./update-button.component.css'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        MatDialog,
        NotificationsService])
], UpdateButtonComponent);
export { UpdateButtonComponent };
//# sourceMappingURL=../../../../app/widgets/update-button/update-button.component.js.map