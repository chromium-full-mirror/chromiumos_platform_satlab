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
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { ViewDutsComponent } from '../view-duts/view-duts.component';
import { ProvisionDialogComponent } from '../provision-dialog/provision-dialog.component';
import { NotificationsService } from 'app/services/notifications.service';
let EnrollmentComponent = class EnrollmentComponent {
    constructor(moblabGrpcService, router, dialog, notificationsService) {
        this.moblabGrpcService = moblabGrpcService;
        this.router = router;
        this.dialog = dialog;
        this.notificationsService = notificationsService;
        this.duts = new MatTableDataSource();
    }
    enrollSelected() {
        this.dutsTableRef.startLoadingSpinner();
        const hostnames = this.dutsTableRef.getSelectedDutHostnames();
        this.moblabGrpcService.enrollDuts(hostnames, () => {
            this.dutsTableRef.getConnectedDuts();
        }, (msg) => {
            this.notificationsService.error(msg);
            this.dutsTableRef.stopLoadingSpinner();
        });
    }
    unenrollSelected() {
        this.dutsTableRef.startLoadingSpinner();
        const hostnames = this.dutsTableRef.getSelectedDutHostnames();
        this.moblabGrpcService.unenrollDuts(hostnames, () => {
            this.dutsTableRef.getConnectedDuts();
        }, (msg) => {
            this.notificationsService.error(msg);
            this.dutsTableRef.stopLoadingSpinner();
        });
    }
    reverifySelected() {
        this.dutsTableRef.startLoadingSpinner();
        const hostnames = this.dutsTableRef.getSelectedDutHostnames();
        this.moblabGrpcService.reverifyDuts(() => {
            this.dutsTableRef.getConnectedDuts();
        }, (msg) => {
            this.notificationsService.error(msg);
            this.dutsTableRef.stopLoadingSpinner();
        }, hostnames);
    }
    hasSelectedDuts() {
        var _a;
        return ((_a = this.dutsTableRef) === null || _a === void 0 ? void 0 : _a.selection.selected.length) > 0;
    }
    provisionDuts() {
        if (!this.dutsTableRef.duts.data) {
            this.notificationsService.notify('You need to have at least one enrolled DUT');
            return;
        }
        const dialogRef = this.dialog.open(ProvisionDialogComponent, {
            data: { duts: this.dutsTableRef.duts.data },
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                let duts = this.dutsTableRef.duts.data;
                if (result.pool) {
                    duts = duts.filter(dut => { var _a; return (_a = dut.getPoolsList()) === null || _a === void 0 ? void 0 : _a.includes(result.pool); });
                }
                this.moblabGrpcService.provisionDuts(() => {
                    this.dutsTableRef.stopLoadingSpinner();
                    this.router.navigate(['/view_jobs']);
                }, (errorMessage) => {
                    this.dutsTableRef.stopLoadingSpinner();
                    this.notificationsService.error(errorMessage);
                }, result.buildVersion, result.milestone, result.pool);
                this.dutsTableRef.startLoadingSpinner();
            }
        });
    }
};
__decorate([
    ViewChild(ViewDutsComponent),
    __metadata("design:type", ViewDutsComponent)
], EnrollmentComponent.prototype, "dutsTableRef", void 0);
EnrollmentComponent = __decorate([
    Component({
        selector: 'app-enrollment',
        templateUrl: './enrollment.component.html',
        styleUrls: ['./enrollment.component.scss'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        Router,
        MatDialog,
        NotificationsService])
], EnrollmentComponent);
export { EnrollmentComponent };
//# sourceMappingURL=../../../../app/manage-duts/enrollment/enrollment.component.js.map