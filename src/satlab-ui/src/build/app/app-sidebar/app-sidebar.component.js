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
import { GlobalInfoService } from 'app/services/services.module';
import { MoblabSettingsService } from 'app/services/moblab-settings.service';
import { ConfigSetupService } from '../services/moblab-configuration-alerting.service';
import { BuildTargetAccessService } from 'app/services/build-target-access.service';
import { Feature } from 'app/services/services.module';
import { MoblabSettingsConstains, build_access_request_link } from '../constants';
import { MoblabRebootCheckService } from '../services/moblab-reboot-check.service';
import { NotificationsService, } from 'app/services/notifications.service';
let AppSidebarComponent = class AppSidebarComponent {
    constructor(globalInfo, settingsService, configSetupService, notificationsService, buildTargetAccessService, rebootCheckService) {
        this.globalInfo = globalInfo;
        this.settingsService = settingsService;
        this.configSetupService = configSetupService;
        this.notificationsService = notificationsService;
        this.buildTargetAccessService = buildTargetAccessService;
        this.rebootCheckService = rebootCheckService;
        this.build_access_request_link = build_access_request_link;
        this.appErrorMessage = 'This is where error messages go';
        // TODO(crbug.com/1111126) Reference actual Dockerfile var for these port numbers
        // (so we don't hardcode these numbers in multiple places)
        this.mobmonitor_port = '9991';
        this.mobmonitor_link = this._format_mobmonitor_link(window.location.hostname, this.mobmonitor_port);
        this.navTabs = [];
        this.navTestRunMenuOptions = [];
        this.pauseRequestors = [];
        this.notificationsList = [];
        this.modelsWithoutAccess = [];
        this.addSidebarEntry(Feature.DUT_MANAGEMENT, this.navTabs, {
            route: '/manage_dut',
            label: 'Manage DUTs',
            icon: 'laptop_chromebook',
        });
        this.addSidebarEntry(Feature.DUT_DETAIL, this.navTabs, {
            route: '/dut_detail',
            label: 'DUT Detail',
        });
        this.addSidebarEntry(Feature.RUN_TESTS, this.navTabs, {
            route: '/run_tests',
            label: 'Run Suite',
            icon: 'play_arrow',
        });
        this.addSidebarEntry(Feature.VIEW_JOBS, this.navTabs, {
            route: '/view_jobs',
            label: 'View Jobs',
            icon: 'visibility',
        });
        this.addSidebarEntry(Feature.JOB_DETAIL, this.navTabs, {
            route: '/job_detail',
            label: 'Job Detail',
        });
        this.addSidebarEntry(Feature.SYSTEM_CONFIGURATION, this.navTabs, {
            route: '/config',
            label: 'Configuration',
            icon: 'settings',
        });
        this.addSidebarEntry(Feature.MOBMONITOR, this.navTabs, {
            route: '/mobmonitor',
            label: 'Mobmonitor',
            icon: 'security',
        });
        this.addSidebarEntry(Feature.ADVANCED_SETTINGS, this.navTabs, {
            route: '/advanced',
            label: 'Advanced Settings',
            icon: 'settings_applications',
        });
        this.addSidebarEntry(Feature.REPORT_A_PROBLEM, this.navTabs, {
            route: '/report_problem',
            label: 'Report Problem',
            icon: 'bug_report',
        });
        this.addSidebarEntry(Feature.DOCUMENTATION, this.navTabs, {
            route: '/documentation',
            label: 'Documentation',
            icon: 'help',
        });
        this.addSidebarEntry(Feature.ABOUT, this.navTabs, {
            route: '/about',
            label: 'About',
            icon: 'info',
        });
    }
    isPageInformationEnabled() {
        return this.isFeatureEnabled(Feature.TOOLBAR_PAGE_INFORMATION);
    }
    isFeedbackEnabled() {
        return this.isFeatureEnabled(Feature.FEEDBACK_REPORTS);
    }
    isFeatureEnabled(feature) {
        return this.globalInfo.isFeatureEnabled(feature);
    }
    addSidebarEntry(feature, entryList, sidebarEntry) {
        if (this.isFeatureEnabled(feature)) {
            entryList.push(sidebarEntry);
        }
    }
    _format_afe_link(hostname, port) {
        return `http://${hostname}:${port}/afe`;
    }
    _format_mobmonitor_link(hostname, port) {
        return `http://${hostname}:${port}/static/index.html`;
    }
    ngOnInit() {
        this.settingsService.pauseRequestorsObservable.subscribe(requestors => {
            this.pauseRequestors = requestors;
        });
        this.configSetupService.cloudConfigObservable.subscribe(data => {
            this.cloudConfigError = data['error'];
            if (this.cloudConfigError) {
                // Let user navigate through the UI when unable to retrieve cloud
                // configuration.
                this.cloudConfigEnabled = true;
            }
            else {
                this.cloudConfigEnabled = data['enabled'];
            }
        });
        this.globalInfo.enableNavBarObservable.subscribe(enabled => {
            this.enableNavBar = enabled;
        });
        this.notificationsService.notificationsObservable.subscribe(notifications => {
            this.notificationsList = notifications;
        });
        this.buildTargetAccessService.modelsWithoutAccessObservable.subscribe(models => {
            this.modelsWithoutAccess = models;
        });
        this.rebootCheckService.getMoblabUptime().then(uptime => {
            this.moblabUptime = uptime;
        }, (errorMsg) => {
            console.log('Encountered failure getting moblab timing info. ', errorMsg);
        });
    }
    isSideNavEnabled() {
        return this.enableNavBar && this.cloudConfigEnabled;
    }
    getSideNavTooltip() {
        if (!this.enableNavBar) {
            return 'Disabled. Application is not ready yet!';
        }
        if (!this.cloudConfigEnabled) {
            return 'Disabled. Please provide a valid cloud configuration!';
        }
        return '';
    }
    getPausedDueToUser() {
        return this.pauseRequestors.filter(p => p === MoblabSettingsConstains.USER_REQUEST_STRING);
    }
    getPausedDueToLowDisk() {
        return this.pauseRequestors.filter(p => p === MoblabSettingsConstains.LOW_DISK_SPACE_STRING);
    }
    // Prevents unnecessary rerendering of the list,
    // which was cancelling click event on Dismiss button
    // on notification banners.
    trackByFn(_, item) {
        return item.notification;
    }
    dismissNotification(notification) {
        this.notificationsService.dismiss(notification.id);
    }
};
AppSidebarComponent = __decorate([
    Component({
        selector: 'app-sidebar',
        templateUrl: './app-sidebar.component.html',
        styleUrls: ['./app-sidebar.component.scss'],
    }),
    __metadata("design:paramtypes", [GlobalInfoService,
        MoblabSettingsService,
        ConfigSetupService,
        NotificationsService,
        BuildTargetAccessService,
        MoblabRebootCheckService])
], AppSidebarComponent);
export { AppSidebarComponent };
//# sourceMappingURL=../../../app/app-sidebar/app-sidebar.component.js.map