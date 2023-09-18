var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Component, Input, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { ConnectedDutInfo } from 'app/services/moblabrpc_pb';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { NotificationsService } from 'app/services/notifications.service';
import { BuildTargetAccessService } from 'app/services/build-target-access.service';
import { StageBuildDialogComponent } from '../stage-build-dialog/stage-build-dialog.component';
import { INT_TO_DUT_STATUS } from '../../utils/proto_helpers';
import { TableHeaderSelectorComponent } from '../../widgets/table-header-selector/table-header-selector.component';
const NOT_CONNECTED_MESSAGE = 'DUT not reachable by SSH';
const NO_ACCESS_MESSAGE = 'The account does not have access to this build target';
const ALL_ENROLLED = 'All Enrolled';
const ALL_UNENROLLED = 'All Unenrolled';
const REPAIR_FAILED = 'Repair Failed';
let ViewDutsComponent = class ViewDutsComponent {
    constructor(moblabGrpcService, dialog, notificationsService, buildTargetAccessService) {
        this.moblabGrpcService = moblabGrpcService;
        this.dialog = dialog;
        this.notificationsService = notificationsService;
        this.buildTargetAccessService = buildTargetAccessService;
        this.hideEnrolledDuts = false;
        this.hideUnenrolledDuts = false;
        this.duts = new MatTableDataSource();
        this.displayedColumns = [
            'select',
            'ip',
            'mac',
            'buildtarget',
            'model',
            'status',
            'pools',
            'labels',
        ];
        this.loading = false;
        // Create a local copy as we need to use it in view-duts.component.html.
        this.intToDutStatus = INT_TO_DUT_STATUS;
        this.filterLabels = true;
        this.selection = new SelectionModel(true, []);
        this.buildTargets = [];
        this.selectOptions = [];
    }
    sortingDataAccessor(item, property) {
        switch (property) {
            case 'ip':
                return item.getIp();
            case 'mac':
                return item.getMacAddr();
            case 'buildtarget':
                return item.getBuildTarget();
            case 'model':
                return item.getModel();
            case 'status':
                return item.getStatus();
        }
    }
    ngOnInit() {
        this.setupSelectOptions();
        this.getConnectedDuts();
        this.buildTargetAccessService.buildTargetsObservable.subscribe(buildTargets => {
            this.buildTargets = buildTargets;
        });
    }
    ngOnChanges(changes) {
        if (changes.hideUnenrolledDuts || changes.hideEnrolledDuts) {
            this.setupSelectOptions();
        }
    }
    setupSelectOptions() {
        this.selectOptions = [
            ...(this.hideEnrolledDuts ? [] : [ALL_ENROLLED]),
            ...(this.hideUnenrolledDuts ? [] : [ALL_UNENROLLED]),
            REPAIR_FAILED
        ];
    }
    assignDuts(duts) {
        this.duts = new MatTableDataSource(duts);
        this.duts.sortingDataAccessor = this.sortingDataAccessor;
        this.duts.sort = this.matSort;
    }
    getConnectedDuts() {
        this.loading = true;
        this.moblabGrpcService.listConnectedDuts((connectedDuts) => {
            this.loading = false;
            this.buildTargetAccessService.updateModelsWithoutAccess(connectedDuts);
            this.assignDuts(connectedDuts);
            this.unselectAll();
        }, (message) => {
            this.loading = false;
            this.assignDuts([]);
            this.unselectAll();
            this.notificationsService.error(message);
        });
    }
    hasAccessToBuildTarget(dut) {
        // skip the access check if dut is not enrolled or API has not returned yet
        if (this.buildTargets.length === 0 || !dut.getIsEnrolled()) {
            return true;
        }
        return this.buildTargets.includes(dut.getBuildTarget());
    }
    getDisabledReason(dut) {
        if (!this.hasAccessToBuildTarget(dut)) {
            return NO_ACCESS_MESSAGE;
        }
        else if (!dut.getIsConnected()) {
            return NOT_CONNECTED_MESSAGE;
        }
        else {
            return '';
        }
    }
    setHideUnenrolledDuts(hide) {
        this.hideUnenrolledDuts = hide;
    }
    getNumSelectedDuts() {
        return this.selection.selected.length;
    }
    refreshConnectedDuts() {
        this.duts.data = [];
        this.getConnectedDuts();
    }
    startLoadingSpinner() {
        this.loading = true;
    }
    stopLoadingSpinner() {
        this.loading = false;
    }
    toggleFilterLabels() {
        this.filterLabels = !this.filterLabels;
    }
    getSelectedDutHostnames() {
        const hostnames = [];
        this.duts.data.forEach(row => {
            if (this.selection.isSelected(row)) {
                hostnames.push(row.getIp());
            }
        });
        return hostnames;
    }
    unselectAll() {
        this.headerSelectorRef.setCheckboxState(false);
        this.selection.clear();
    }
    selectionChanged(event) {
        if (event.selection === 'All') {
            this.duts.data.filter(e => {
                return e.getIsConnected() && (this.hideUnenrolledDuts ? e.getIsEnrolled() : true);
            }).forEach(row => this.selection.select(row));
        }
        else if (event.selection === 'None') {
            this.selection.clear();
        }
        else if (event.selection === ALL_ENROLLED) {
            this.duts.data.filter(row => {
                if (row.getIsEnrolled() && row.getIsConnected()) {
                    this.selection.select(row);
                }
                else {
                    this.selection.deselect(row);
                }
            });
        }
        else if (!this.hideUnenrolledDuts && event.selection === ALL_UNENROLLED) {
            this.duts.data.filter(row => {
                if (!row.getIsEnrolled() && row.getIsConnected()) {
                    this.selection.select(row);
                }
                else {
                    this.selection.deselect(row);
                }
            });
        }
        else if (event.selection === REPAIR_FAILED) {
            this.duts.data.filter(row => {
                if (row.getStatus() === ConnectedDutInfo.DutStatus.DUT_STATUS_REPAIR_FAILED && row.getIsConnected()) {
                    this.selection.select(row);
                }
                else {
                    this.selection.deselect(row);
                }
            });
        }
    }
    accessTestBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            const dialogRef = this.dialog.open(StageBuildDialogComponent);
            try {
                const responseMessage = yield dialogRef.afterClosed().toPromise();
                if (responseMessage) {
                    this.notificationsService.notify(responseMessage);
                }
            }
            catch (error) {
                this.notificationsService.error(error);
            }
        });
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], ViewDutsComponent.prototype, "hideEnrolledDuts", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], ViewDutsComponent.prototype, "hideUnenrolledDuts", void 0);
__decorate([
    ViewChild(TableHeaderSelectorComponent),
    __metadata("design:type", TableHeaderSelectorComponent)
], ViewDutsComponent.prototype, "headerSelectorRef", void 0);
__decorate([
    ViewChild(MatSort, {}),
    __metadata("design:type", MatSort)
], ViewDutsComponent.prototype, "matSort", void 0);
ViewDutsComponent = __decorate([
    Component({
        selector: 'app-view-duts',
        templateUrl: './view-duts.component.html',
        styleUrls: ['./view-duts.component.css'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        MatDialog,
        NotificationsService,
        BuildTargetAccessService])
], ViewDutsComponent);
export { ViewDutsComponent };
//# sourceMappingURL=../../../../app/manage-duts/view-duts/view-duts.component.js.map