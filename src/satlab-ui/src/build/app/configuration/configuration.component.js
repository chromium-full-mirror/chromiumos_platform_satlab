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
import { ChangeDetectorRef, Component, ViewChild, } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { leadingTrailingWhitespaceValidator } from '../utils/validators';
import { MoblabGrpcService } from '../services/moblab-grpc.service';
import { MoblabConfigurationGrpcService } from '../services/moblab-configuration-grpc.service';
import { MoblabSettingsService } from '../services/moblab-settings.service';
import { ConfigSetupService } from '../services/moblab-configuration-alerting.service';
import { ButtonWithProgressComponent } from '../widgets/button-with-progress/button-with-progress.component';
import { StageBuildDialogComponent } from '../manage-duts/stage-build-dialog/stage-build-dialog.component';
import { MoblabSettingsConstains, build_access_request_link } from '../constants';
import { NotificationsService } from '../services/notifications.service';
import { GlobalInfoService, } from 'app/services/global-ui-settings.service';
import { MatTableDataSource } from "@angular/material/table";
function gsURLValidator(control) {
    if (!control.value) {
        return null;
    }
    const forbidden = !new RegExp('^gs:\\/\\/.*').test(control.value);
    return forbidden ? { notAGSUrl: { value: control.value } } : null;
}
function validChromeosBuildPattern(control) {
    if (!control.value) {
        return null;
    }
    const value = control.value.trim();
    const forbidden = !new RegExp(/^R[0-9]{2,3}-[0-9]{5,}\.[0-9]{1,}\.[0-9]{1,}$/).test(value);
    return forbidden ? { validChromeosBuildPattern: { value: control.value } } : null;
}
class CloudConfiguration {
    constructor(isCloudEnabled = false, isRemoteConsoleEnabled = false, isRemoteCommandEnabled = false, botoKeyID = '', botoKeySecret = '', bucketURL = '') {
        this.isCloudEnabled = isCloudEnabled;
        this.isRemoteConsoleEnabled = isRemoteConsoleEnabled;
        this.isRemoteCommandEnabled = isRemoteCommandEnabled;
        this.botoKeyID = botoKeyID;
        this.botoKeySecret = botoKeySecret;
        this.bucketURL = bucketURL;
    }
}
let ConfigurationComponent = class ConfigurationComponent {
    constructor(changeDetector, moblabRpcService, settingsService, moblabConfigurationRpcService, configSetupService, notificationsService, globalInfo, dialog) {
        this.changeDetector = changeDetector;
        this.moblabRpcService = moblabRpcService;
        this.settingsService = settingsService;
        this.moblabConfigurationRpcService = moblabConfigurationRpcService;
        this.configSetupService = configSetupService;
        this.notificationsService = notificationsService;
        this.globalInfo = globalInfo;
        this.dialog = dialog;
        this.build_access_request_link = build_access_request_link;
        this.errors = false;
        this.canUpdateCloudConfig = false;
        this.isCloudEnabled = false;
        this.isRemoteConsoleEnabled = false;
        this.isRemoteCommandEnabled = false;
        this.isHostSchedulerPauseRequested = false;
        this.botoKeyIDForm = new FormControl('', {
            validators: [Validators.required],
        });
        this.botoKeySecretForm = new FormControl('', {
            validators: [Validators.required],
        });
        this.bucketURLForm = new FormControl('', {
            validators: [Validators.required, gsURLValidator],
        });
        this.userCrOSVersionForm = new FormControl('', { validators: [validChromeosBuildPattern], });
        this.resultsRetentionPeriodForm = new FormControl('', [
            Validators.required,
            Validators.pattern(/^(([01]?[1-9]|2[0-3])h)$|^([1-7]d)$/),
        ]);
        this.userCrOSVersionValue = '';
        this.resultsRetentionPeriod = '';
        this.bucketLink = '';
        this.cloudConfigDisabledMessage = '';
        this.showUncheckWarning = false;
        this.configurationLoading = false;
        this.lastFetchedCloudConfig = new CloudConfiguration();
        this.dutWifiInfoLoading = false;
        this.dutWifiNameForm = new FormControl('', {
            validators: [leadingTrailingWhitespaceValidator],
        });
        this.dutWifiPasswordForm = new FormControl('');
        this.lastFetchedDutWifiName = '';
        this.lastFetchedDutWifiPassword = '';
        this.pauseStatusSubscription = null;
        this.panelOpenState = true;
        this.stableBuildVersionLoading = false;
        this.stableBuildVersions = new MatTableDataSource([]);
        this.displayedColumns = [
            'build_target',
            'default_version',
            'override_version',
        ];
        this.isAnyDutEnrolled = () => this.stableBuildVersions.data.length != 0;
    }
    ngOnInit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bucketURLForm.valueChanges.subscribe(value => {
                this.formatBucketLink();
            });
            this.pauseStatusSubscription = this.settingsService.pauseRequestorsObservable.subscribe(requestors => {
                this.isHostSchedulerPauseRequested =
                    requestors &&
                        requestors.includes(MoblabSettingsConstains.USER_REQUEST_STRING);
            });
            this.getCloudConfiguration();
            this.getDutWifiInfo();
            this.initCanUpdateCloudConfigFlag();
            yield Promise.all([
                this.listStableBuildVersions(),
                this.getResultsRetentionPeriod(),
            ]);
        });
    }
    ngOnDestroy() {
        this.pauseStatusSubscription.unsubscribe();
    }
    listStableBuildVersions() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(this.stableBuildVersions);
            this.userCrOSVersionForm.disable({ emitEvent: false });
            this.stableBuildVersionLoading = true;
            console.log(this.stableBuildVersions);
            try {
                const data = yield this.moblabConfigurationRpcService.listStableBuildVersions();
                this.stableBuildVersions = new MatTableDataSource(data);
                // User override stable build version is the same for all build targets
                if (data.length !== 0) {
                    this.userCrOSVersionValue = data[0]
                        .getStableVersion()
                        .getOverrideVersion();
                }
            }
            catch (error) {
                console.log('listStableBuildVersions call failed with:' + error);
                this.notificationsService.error('Failed to fetch stable build versions: ' + error.message);
            }
            finally {
                if (this.isAnyDutEnrolled()) {
                    this.userCrOSVersionForm.enable({ emitEvent: false });
                }
                this.stableBuildVersionLoading = false;
            }
        });
    }
    getStableBuildVersion(buildVersion) {
        return (buildVersion.getStableVersion().getOverrideVersion() ||
            buildVersion.getStableVersion().getDefaultVersion());
    }
    getStableBuildVersionDefault(buildVersion) {
        return buildVersion.getStableVersion().getOverrideVersion().length === 0
            ? '(default)'
            : '';
    }
    getResultsRetentionPeriod() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resultsRetentionPeriodForm.disable();
            try {
                const period_days = yield this.moblabConfigurationRpcService.getResultsRetentionPeriod();
                this.resultsRetentionPeriod = period_days;
                this.resultsRetentionPeriodForm.setValue(period_days);
            }
            catch (error) {
                console.log('getResultsRetentionPeriod call failed with:' + error);
                this.notificationsService.error('Failed to fetch results retention duration: ' + error.message);
            }
            finally {
                this.resultsRetentionPeriodForm.enable();
            }
        });
    }
    setResultsRetentionPeriod(period) {
        return __awaiter(this, void 0, void 0, function* () {
            this.resultsRetentionPeriodForm.disable();
            try {
                yield this.moblabConfigurationRpcService.setResultsRetentionPeriod(period);
                this.getResultsRetentionPeriod();
            }
            catch (error) {
                console.log('setStableBuildVersion call failed with:' + error);
                this.notificationsService.error('Failed to set stable Chrome OS version: ' + error.message);
            }
            finally {
                this.resultsRetentionPeriodForm.enable();
            }
        });
    }
    setStableCrOSVersion(override_value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.stableBuildVersionLoading = true;
            this.userCrOSVersionForm.setErrors(null);
            try {
                yield this.moblabConfigurationRpcService.setStableBuildVersion(override_value);
                yield this.listStableBuildVersions();
                this.userCrOSVersionForm.reset();
            }
            catch (error) {
                this.userCrOSVersionForm.setErrors({ apiResponseError: error.message }, { emitEvent: true });
                console.log('setStableBuildVersion call failed with:' + error);
            }
            finally {
                this.stableBuildVersionLoading = false;
            }
        });
    }
    getCloudConfiguration(calledOnSubmit = false) {
        /**
         * Method sends RPC command to fetch cloud configuration information and
         * apply fetched values to the UI forms.
         *
         * Parameter calledOnSubmit is set to true when this method is called from
         * the onCloudConfigSubmit method.
         */
        this.configurationLoading = true;
        this.moblabRpcService.get_cloud_configuration((boto_key_id, boto_key_secret, gcs_bucket_url, is_cloud_enabled, is_remote_console_enabled, is_remote_command_enabled) => {
            this.updateCloudConfigurationForms(new CloudConfiguration(is_cloud_enabled, is_remote_console_enabled, is_remote_command_enabled, boto_key_id, boto_key_secret, gcs_bucket_url));
            // If called from the onCloudConfigSubmit method, suppress the popup.
            if (!this.configSetupService.getIsCloudConfigEnabled() &&
                !calledOnSubmit) {
                this.notificationsService
                    .notify(`Please enable the Cloud integration to
              allow system to fetch Chrome OS test images and upload test
              results for CPCon ingestion.`);
            }
        }, (errorMsg) => {
            this.configurationLoading = false;
            this.notificationsService.error('Failed to get cloud configuration: ' + errorMsg);
        });
    }
    getDutWifiInfo() {
        this.dutWifiInfoLoading = true;
        this.moblabRpcService.get_dut_wifi_info((dut_wifi_name, dut_wifi_password) => {
            this.setDutWifiInfo(dut_wifi_name, dut_wifi_password);
        }, (errorMsg) => {
            this.dutWifiInfoLoading = false;
            this.notificationsService.error('Failed to get DUT wifi info: ' + errorMsg);
        });
    }
    onDutWifiInfoSubmit(formValue) {
        this.dutWifiInfoLoading = true;
        this.moblabRpcService.set_dut_wifi_info((message) => {
            this.notificationsService.notify(message);
            this.getDutWifiInfo();
        }, (errorMsg) => {
            this.dutWifiInfoLoading = false;
            this.notificationsService.error(errorMsg);
        }, this.dutWifiNameForm.value, this.dutWifiPasswordForm.value);
    }
    isCloudConfigurationChanged() {
        /**
         * Returns true IFF there is a change in any of the cloud configuration
         * values.
         */
        return (this.lastFetchedCloudConfig.botoKeyID !== this.botoKeyIDForm.value ||
            this.lastFetchedCloudConfig.botoKeySecret !==
                this.botoKeySecretForm.value ||
            this.lastFetchedCloudConfig.bucketURL !== this.bucketURLForm.value ||
            this.lastFetchedCloudConfig.isCloudEnabled !== this.isCloudEnabled ||
            this.lastFetchedCloudConfig.isRemoteConsoleEnabled !==
                this.isRemoteConsoleEnabled ||
            this.lastFetchedCloudConfig.isRemoteCommandEnabled !==
                this.isRemoteCommandEnabled);
    }
    isDutWifiInfoValidForSubmit() {
        return (this.dutWifiNameForm.value.length &&
            !this.dutWifiNameForm.errors &&
            !this.dutWifiPasswordForm.errors &&
            (this.lastFetchedDutWifiName !== this.dutWifiNameForm.value ||
                this.lastFetchedDutWifiPassword !== this.dutWifiPasswordForm.value));
    }
    isStableCrOsVersionValidForSubmit() {
        return (this.stableBuildVersions.data.length != 0 &&
            this.userCrOSVersionForm.value &&
            this.userCrOSVersionForm.value.length &&
            this.userCrOSVersionForm.value !== this.userCrOSVersionValue &&
            !this.userCrOSVersionForm.errors);
    }
    isRetentionPeriodValidForSubmit() {
        return (this.resultsRetentionPeriodForm.value !== this.resultsRetentionPeriod &&
            !this.resultsRetentionPeriodForm.errors);
    }
    setDutWifiInfo(dut_wifi_name, dut_wifi_password) {
        this.dutWifiNameForm.setValue(dut_wifi_name);
        this.dutWifiPasswordForm.setValue(dut_wifi_password);
        this.lastFetchedDutWifiName = dut_wifi_name;
        this.lastFetchedDutWifiPassword = dut_wifi_password;
        this.dutWifiInfoLoading = false;
    }
    disableCloudConfigSubmissionButton() {
        return (!this.isCloudConfigurationChanged() ||
            this.botoKeySecretForm.errors ||
            this.botoKeyIDForm.errors ||
            this.bucketURLForm.errors);
    }
    enableLink() {
        return !this.bucketURLForm.errors;
    }
    formatBucketLink() {
        if (this.enableLink()) {
            this.bucketLink =
                'https://console.cloud.google.com/storage/browser/' +
                    this.bucketURLForm.value.split('//')[1];
        }
        else {
            this.bucketLink = '';
        }
    }
    toggleCloudConfigDisabledMessage() {
        /**
         * Will set tooltip hover of cloud configuration forms to show that cloud
         * integration needs to be enabled before any change is made.
         */
        if (this.isCloudEnabled) {
            this.cloudConfigDisabledMessage = '';
        }
        else {
            this.cloudConfigDisabledMessage =
                "Cloud settings are not enabled, please check 'enable' above if you would " +
                    ' like to opt-in to cloud interaction for your Moblab.';
        }
    }
    isCloudEnabledCheckboxChange() {
        /**
         * Invoked on change of cloud enabled checkbox.
         */
        this.isCloudEnabled = !this.isCloudEnabled;
        if (this.isCloudEnabled) {
            this.isRemoteCommandEnabled = true;
            this.isRemoteConsoleEnabled = true;
        }
        this.toggleCloudConfigDisabledMessage();
    }
    isRemoteConsoleEnabledCheckboxChange() {
        /**
         * Invoked on change of remote console enabled checkbox.
         */
        this.isRemoteConsoleEnabled = !this.isRemoteConsoleEnabled;
    }
    isRemoteCommandEnabledCheckboxChange() {
        /**
         * Invoked on change of remote command enabled checkbox.
         */
        this.isRemoteCommandEnabled = !this.isRemoteCommandEnabled;
    }
    ngAfterContentInit() {
        this.changeDetector.detectChanges();
    }
    /** Checks if the Moblab has ran some jobs already,
     * if so user can not change the boto key or gc bucket. */
    initCanUpdateCloudConfigFlag() {
        this.botoKeyIDForm.disable();
        this.botoKeySecretForm.disable();
        this.bucketURLForm.disable();
        this.canUpdateCloudConfig = false;
        this.moblabRpcService.getNumJobs((count) => {
            this.canUpdateCloudConfig = count === 0;
            if (this.canUpdateCloudConfig) {
                this.botoKeyIDForm.enable();
                this.botoKeySecretForm.enable();
                this.bucketURLForm.enable();
            }
        });
    }
    onCloudConfigSubmit(formValue) {
        if (!this.bucketURLForm.value.endsWith('/')) {
            this.bucketURLForm.setValue(this.bucketURLForm.value + '/');
        }
        this.configurationLoading = true;
        this.moblabRpcService.set_cloud_configuration((message) => {
            this.notificationsService.notify(message);
            this.getCloudConfiguration(true);
        }, (errorMsg) => {
            this.configurationLoading = false;
            this.notificationsService.error(errorMsg);
        }, this.isCloudEnabled ? this.botoKeyIDForm.value : '', this.isCloudEnabled ? this.botoKeySecretForm.value : '', this.isCloudEnabled ? this.bucketURLForm.value : '', this.isCloudEnabled, this.isRemoteConsoleEnabled, this.isRemoteCommandEnabled);
    }
    cloudCheckboxHoverStart() {
        /**
         * Invoked on mouseover of the enable cloud checkbox. Will associate error
         * messages on cloud configuration forms that unchecking cloud integration
         * will clear existing cloud config values ( error messages are set only if
         * the cloud checkbox in enabled during mouseover and there is at least one
         * non-empty cloud configuration ).
         */
        if (this.isCloudEnabled &&
            (this.botoKeyIDForm.value ||
                this.botoKeySecretForm.value ||
                this.bucketURLForm.value)) {
            this.showUncheckWarning = true;
            const clearError = { clearWarning: true };
            this.botoKeyIDForm.setErrors(clearError);
            this.botoKeySecretForm.setErrors(clearError);
            this.bucketURLForm.setErrors(clearError);
        }
    }
    cloudCheckboxHoverStop() {
        /**
         * Invoked on mouseoff of the enable cloud checkbox. Will clear the error
         * set by cloudCheckboxHoverStart
         */
        if (this.botoKeyIDForm.value ||
            this.botoKeySecretForm.value ||
            this.bucketURLForm.value) {
            this.botoKeyIDForm.setErrors(null);
            this.botoKeySecretForm.setErrors(null);
            this.bucketURLForm.setErrors(null);
            this.botoKeyIDForm.updateValueAndValidity();
            this.botoKeySecretForm.updateValueAndValidity();
            this.bucketURLForm.updateValueAndValidity();
        }
    }
    updateCloudConfigurationForms(newCloudConfig) {
        /**
         * Updates the form values of the cloud configurations. Meant to be called
         * with values returned from RPC call to get cloud info.
         */
        this.botoKeyIDForm.setValue(newCloudConfig.botoKeyID);
        this.botoKeySecretForm.setValue(newCloudConfig.botoKeySecret);
        this.bucketURLForm.setValue(newCloudConfig.bucketURL);
        this.isCloudEnabled = newCloudConfig.isCloudEnabled;
        this.isRemoteConsoleEnabled = newCloudConfig.isRemoteConsoleEnabled;
        this.isRemoteCommandEnabled = newCloudConfig.isRemoteCommandEnabled;
        this.toggleCloudConfigDisabledMessage();
        this.lastFetchedCloudConfig = newCloudConfig;
        this.configurationLoading = false;
    }
    pauseClick() {
        return __awaiter(this, void 0, void 0, function* () {
            this.pauseButton.setIsLoadingStatus(true);
            try {
                const pauseRequesters = yield this.moblabConfigurationRpcService.pauseHostScheduling();
                this.settingsService.updateHostSchedulingStatus(pauseRequesters);
            }
            catch (error) {
                console.log('pauseHostScheduling call failed with:' + error);
                this.notificationsService.error('Failed to pause host scheduling: ' + error);
            }
            finally {
                this.pauseButton.setIsLoadingStatus(false);
            }
        });
    }
    resumeClick() {
        return __awaiter(this, void 0, void 0, function* () {
            this.resumeButton.setIsLoadingStatus(true);
            try {
                const pauseRequesters = yield this.moblabConfigurationRpcService.resumeHostScheduler();
                this.settingsService.updateHostSchedulingStatus(pauseRequesters);
            }
            catch (error) {
                console.log('resumeHostScheduler call failed with:' + error);
                this.notificationsService.error('Failed to resume host scheduling: ' + error);
            }
            finally {
                this.resumeButton.setIsLoadingStatus(false);
            }
        });
    }
    stageTestBuild() {
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
    ViewChild('pauseButton'),
    __metadata("design:type", ButtonWithProgressComponent)
], ConfigurationComponent.prototype, "pauseButton", void 0);
__decorate([
    ViewChild('resumeButton'),
    __metadata("design:type", ButtonWithProgressComponent)
], ConfigurationComponent.prototype, "resumeButton", void 0);
ConfigurationComponent = __decorate([
    Component({
        selector: 'app-configuration',
        templateUrl: './configuration.component.html',
        styleUrls: ['./configuration.component.scss'],
    }),
    __metadata("design:paramtypes", [ChangeDetectorRef,
        MoblabGrpcService,
        MoblabSettingsService,
        MoblabConfigurationGrpcService,
        ConfigSetupService,
        NotificationsService,
        GlobalInfoService,
        MatDialog])
], ConfigurationComponent);
export { ConfigurationComponent };
//# sourceMappingURL=../../../app/configuration/configuration.component.js.map