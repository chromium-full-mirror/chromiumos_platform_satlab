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
import { ChangeDetectorRef, Component, ViewChild, } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { INT_TO_DUT_STATUS } from '../utils/proto_helpers';
import { DutTaskTableComponent } from './dut_task_table/dut_task_table.component';
import { KeyValTableComponent } from '../widgets/keyval-table/keyval-table.component';
import { NotificationsService } from '../services/notifications.service';
import { MoblabGrpcService } from '../services/moblab-grpc.service';
import { ViewJobsComponent } from '../view-jobs/view-jobs.component';
let DutDetailComponent = class DutDetailComponent {
    constructor(cd, moblabGrpcService, route, notificationsService) {
        this.cd = cd;
        this.moblabGrpcService = moblabGrpcService;
        this.route = route;
        this.notificationsService = notificationsService;
        this.serverControlFile = '';
        this.dutQuery = new FormControl('', Validators.minLength(1));
        this.servoSerialNumber = new FormControl('', Validators.pattern('(SERVOV4P1-)?[CGS](-)?[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[0-1])[0-9]{4}'));
    }
    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.dutQuery.setValue(params.get('dut_hostname'));
        });
    }
    ngAfterContentInit() {
        if (this.dutQuery.value) {
            this.fetchDutDetails();
        }
        this.cd.detectChanges();
    }
    setDutDetails(dutInfo) {
        this.dutInfoTableRef.loadRows([
            ['DUT', dutInfo.getIp()],
            ['MAC', dutInfo.getMacAddr()],
            ['Status', INT_TO_DUT_STATUS[dutInfo.getStatus()]],
            ['Labels', dutInfo.getLabelsList().toString()],
            ['Attributes', dutInfo.getAttributesList().toString()],
            [
                'Current Job',
                dutInfo.getCurrentJob() ? dutInfo.getCurrentJob().toString() : '',
            ],
            ['Current DUT Task', dutInfo.getCurrentDutTask()],
        ]);
        this.dutTaskTableRef.setDutIp(this.dutQuery.value);
        this.associatedJobsTableRef.setDutIp(this.dutQuery.value);
        this.associatedJobsTableRef.refreshJobs();
    }
    fetchDutDetails() {
        if (this.dutTaskTableRef) {
            this.dutTaskTableRef.setDutIp(this.dutQuery.value);
        }
        this.moblabGrpcService.getDutDetails((dutInfo) => {
            this.setDutDetails(dutInfo);
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, this.dutQuery.value);
    }
    repairDut() {
        this.moblabGrpcService.repairDut((message) => {
            this.notificationsService.notify('Set off repair task on DUT, please refresh page for status.');
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, this.dutQuery.value);
    }
    reverifyDut() {
        this.moblabGrpcService.reverifyDuts((message) => {
            this.notificationsService.notify('Set off reverify task on DUT, please refresh page for status.');
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, [this.dutQuery.value]);
    }
    addServo() {
        this.moblabGrpcService.addServo(() => {
            this.notificationsService.notify('Add servo serial number to dut and reverify, please refresh page for status.');
        }, errorMsg => {
            this.notificationsService.error(errorMsg);
        }, this.dutQuery.value, this.servoSerialNumber.value);
    }
    isDutInfoTableEmpty() {
        return !this.dutInfoTableRef || this.dutInfoTableRef.isEmpty();
    }
};
__decorate([
    ViewChild('dut_info_table'),
    __metadata("design:type", KeyValTableComponent)
], DutDetailComponent.prototype, "dutInfoTableRef", void 0);
__decorate([
    ViewChild('dut_task_table'),
    __metadata("design:type", DutTaskTableComponent)
], DutDetailComponent.prototype, "dutTaskTableRef", void 0);
__decorate([
    ViewChild('associated_jobs_table'),
    __metadata("design:type", ViewJobsComponent)
], DutDetailComponent.prototype, "associatedJobsTableRef", void 0);
DutDetailComponent = __decorate([
    Component({
        selector: 'app-dut-detail',
        templateUrl: './dut-detail.component.html',
        styleUrls: ['./dut-detail.component.css'],
        animations: [],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        ActivatedRoute,
        NotificationsService])
], DutDetailComponent);
export { DutDetailComponent };
//# sourceMappingURL=../../../app/dut-detail/dut-detail.component.js.map