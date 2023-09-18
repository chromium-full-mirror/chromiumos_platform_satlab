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
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { INT_TO_DUT_TASK_STATUS } from '../../utils/proto_helpers';
import { MoblabGrpcService } from '../../services/moblab-grpc.service';
import { normalizeTimestamp } from '../../utils/date';
import { NotificationsService } from '../../services/notifications.service';
let DutTaskTableComponent = class DutTaskTableComponent {
    constructor(moblabGrpcService, notificationsService) {
        this.moblabGrpcService = moblabGrpcService;
        this.notificationsService = notificationsService;
        this.displayedColumns = [
            'task',
            'time_started',
            'time_finished',
            'logs',
        ];
        this.numDutTasks = 0;
        this.normalizeTimestamp = normalizeTimestamp;
        this.tasks = new MatTableDataSource();
        this.DEFAULT_PAGE_SIZE = 10;
    }
    ngAfterViewInit() {
        this.paginator.page.subscribe(() => this.getNextPageDutTasks());
    }
    setDutIp(dutIp) {
        this.dutIp = dutIp;
        this.getNextPageDutTasks();
    }
    setDutTasks(dut_tasks) {
        this.tasks = new MatTableDataSource(dut_tasks);
    }
    getNextPageDutTasks() {
        this.moblabGrpcService.getDutTasks((dutTasks) => {
            this.setDutTasks(dutTasks);
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, this.dutIp, this.paginator.pageIndex * this.paginator.pageSize
            ? this.paginator.pageIndex * this.paginator.pageSize
            : 0, this.paginator.pageSize ? this.paginator.pageSize : this.DEFAULT_PAGE_SIZE);
        this.moblabGrpcService.getNumDutTasks((numDutTasks) => {
            this.numDutTasks = numDutTasks;
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, this.dutIp);
    }
    getStatusFromNum(statusNum) {
        return INT_TO_DUT_TASK_STATUS[statusNum];
    }
    construct_task_logs_link(task) {
        return `/results/hosts/${this.dutIp}/${task.getTaskLogId().toLowerCase()}/`;
    }
};
__decorate([
    ViewChild(MatPaginator),
    __metadata("design:type", MatPaginator)
], DutTaskTableComponent.prototype, "paginator", void 0);
DutTaskTableComponent = __decorate([
    Component({
        selector: 'app-dut-task-table',
        templateUrl: './dut_task_table.component.html',
        styleUrls: ['./dut_task_table.component.css'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        NotificationsService])
], DutTaskTableComponent);
export { DutTaskTableComponent };
//# sourceMappingURL=../../../../app/dut-detail/dut_task_table/dut_task_table.component.js.map