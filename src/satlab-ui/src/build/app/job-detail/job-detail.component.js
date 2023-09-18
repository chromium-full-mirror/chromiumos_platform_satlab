var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ActivatedRoute } from '@angular/router';
import { Component, ViewChild, } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, Validators } from '@angular/forms';
import { MoblabGrpcService } from '../services/moblab-grpc.service';
import { normalizeTimestamp } from '../utils/date';
import { INT_TO_JOBSTATUS, INT_TO_PRIORITY } from '../utils/proto_helpers';
import { forbiddenIDValidator } from '../utils/validators';
import { ViewJobsComponent } from '../view-jobs/view-jobs.component';
import { KeyValTableComponent, } from '../widgets/keyval-table/keyval-table.component';
import { NotificationsService } from '../services/notifications.service';
let JobDetailComponent = class JobDetailComponent {
    constructor(cd, moblabGrpcService, route, notificationsService) {
        this.cd = cd;
        this.moblabGrpcService = moblabGrpcService;
        this.route = route;
        this.notificationsService = notificationsService;
        this.jobQuery = new FormControl('', [
            Validators.minLength(1),
            forbiddenIDValidator,
        ]);
        this.jobInfoTable = new MatTableDataSource();
        this.jobHistoryTable = new MatTableDataSource();
        this.associatedDutsTable = new MatTableDataSource();
        this.serverControlFile = '';
        this.normalizeTimestamp = normalizeTimestamp;
        this.jobDetailsTableColumns = ['key', 'value'];
        this.jobHistoryTableColumns = [
            'job_id',
            'name',
            'dut',
            'start_time',
            'end_time',
            'time_used',
            'status',
        ];
        this.associatedDutsTableColumns = [
            'dut',
            'dut_status',
            'status',
            'logs',
        ];
    }
    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.jobQuery.setValue(params.get('job_id'));
        });
    }
    ngAfterContentInit() {
        if (this.jobQuery.value) {
            this.fetchJobDetails();
        }
        this.cd.detectChanges();
    }
    getPriorityFromInt(enum_int) {
        return INT_TO_PRIORITY[enum_int];
    }
    getStatusFromInt(enum_int) {
        return INT_TO_JOBSTATUS[enum_int];
    }
    fetchJobDetails() {
        // Reset current job info.
        this.resetJob();
        this.moblabGrpcService.getJobDetails((jobInfo) => {
            this.unpackJobInfoToTable(jobInfo);
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, this.jobQuery.value);
    }
    unpackJobInfoToTable(job) {
        this.jobInfoTableRef.loadRows([
            ['Name', job.getName()],
            ['ID', job.getJobId().toString()],
            ['Parent ID', job.getParentJobId().toString()],
            ['Dependencies', job.getDependencies()],
            ['Priority', INT_TO_PRIORITY[job.getPriority()]],
            ['Created time', normalizeTimestamp(job.getCreatedTimeSecUtc())],
            ['Status', INT_TO_JOBSTATUS[job.getStatus()]],
            ['Timeout', (job.getTimeout() / 60 / 1000).toString() + ' minutes'],
            [
                'Max Runtime',
                (job.getMaxRuntime() / 60 / 1000).toString() + ' minutes',
            ],
        ]);
        this.jobHistoryTable = new MatTableDataSource(job.getExecutionHistoryList());
        this.associatedDutsTable = new MatTableDataSource(job.getAssociatedDutsList());
        this.serverControlFile = job.getServerControlFile();
        this.childViewJobsTableRef.setParentJobId(this.jobQuery.value);
        this.childViewJobsTableRef.refreshJobs();
    }
    getLogsLink(execution) {
        const link = `/results/${execution.getJobId()}-moblab/${execution.getDut()}/`;
        return link;
    }
    resetJob() {
        this.jobInfoTable.data = [];
        this.jobHistoryTable.data = [];
    }
    resetQuery() {
        this.jobQuery.reset();
    }
    isJobInfoTableEmpty() {
        return !this.jobInfoTableRef || this.jobInfoTableRef.isEmpty();
    }
    isJobQueryEmpty() {
        return !this.jobInfoTableRef || !this.jobQuery.value;
    }
};
__decorate([
    ViewChild('child_view_jobs_table'),
    __metadata("design:type", ViewJobsComponent)
], JobDetailComponent.prototype, "childViewJobsTableRef", void 0);
__decorate([
    ViewChild('job_info_table'),
    __metadata("design:type", KeyValTableComponent)
], JobDetailComponent.prototype, "jobInfoTableRef", void 0);
JobDetailComponent = __decorate([
    Component({
        selector: 'app-job-detail',
        templateUrl: './job-detail.component.html',
        styleUrls: ['./job-detail.component.css'],
        animations: [],
        viewProviders: [MatExpansionPanel],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        ActivatedRoute,
        NotificationsService])
], JobDetailComponent);
export { JobDetailComponent };
//# sourceMappingURL=../../../app/job-detail/job-detail.component.js.map