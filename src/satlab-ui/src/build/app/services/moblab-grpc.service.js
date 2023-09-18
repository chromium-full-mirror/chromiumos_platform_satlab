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
import { Injectable } from '@angular/core';
import { MoblabRpcServiceClient, MoblabRpcServicePromiseClient, } from './moblabrpc_grpc_web_pb';
import { ConfigSetupService } from './moblab-configuration-alerting.service';
import { environment } from '../../environments/environment';
import { BUILD_STATUS_MAPPINGS } from '../utils/proto_helpers';
import { AbortJobsRequest, AddAttributeToDutsRequest, AddLabelToDutsRequest, AddPoolToDutsRequest, AddServoRequest, EnrollDutsRequest, GetCloudConfigurationRequest, GetDutWifiInfoRequest, GetDutDetailsRequest, GetDutTasksRequest, GetIsUpdateAvailableRequest, GetJobDetailsRequest, GetJobsRequest, GetNetworkInfoRequest, GetNumDutTasksRequest, GetNumJobsRequest, GetRemoteAgentConfigurationRequest, GetSystemInfoRequest, GetVersionInfoRequest, ListBuildTargetsRequest, ListBuildTargetsByModelRequest, ListBuildVersionsRequest, ListConnectedDutsRequest, ListMilestonesRequest, ListModelsRequest, ListAccessibleModelsRequest, ListPoolsRequest, RebootMoblabRequest, RemoveAttributeFromDutsRequest, RemoveLabelFromDutsRequest, RemovePoolFromDutsRequest, RepairHostRequest, ReverifyHostRequest, RunCtsSuiteRequest, RunGtsSuiteRequest, RunMemoryQualificationSuiteRequest, RunStorageQualificationSuiteRequest, RunFAFTSuiteRequest, RunSuiteRequest, SendMoblabScreenshotRequest, SetCloudConfigurationRequest, SetDutWifiInfoRequest, SetRemoteAgentConfigurationRequest, UpdateDutsFirmwareRequest, UpdateMoblabRequest, ValidateStorageQualSetupRequest, ProvisionDutsRequest, StageBuildRequest, BuildItem, GetPeripheralInformationRequest, RunFWUPDSuiteRequest, } from './moblabrpc_pb';
let MoblabGrpcService = class MoblabGrpcService {
    constructor(configSetupService) {
        this.configSetupService = configSetupService;
        this.moblabRpcService = null;
        this.moblabRpcServicePromiseClient = null;
        const url = new URL(window.location.href);
        const hostname = environment.defaultHostName || url.hostname;
        const port = environment.defaultApiPort || url.port;
        let service_url = new String(url.protocol);
        service_url = service_url.concat('//', hostname, ':', port);
        this.service_address = service_url;
        service_url = service_url.concat('/rpc');
        console.log(service_url);
        this.moblabRpcService = new MoblabRpcServiceClient('http://100.90.97.114/rpc'
        // service_url.toString()
        );
        this.moblabRpcServicePromiseClient = new MoblabRpcServicePromiseClient('http://100.90.97.114/rpc'
        // service_url.toString()
        );
    }
    /** Method for submitting feedback and screenshots to Moblab-associated GCS
     *  bucket.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param description: User-submitted text describing motivation of feedback
     *    submission.
     *  @param screenshot: Serialized, Base64 png screenshot image.
     * */
    sendMoblabScreenshot(callback, error_callback, contact_email, description, screenshot) {
        const request = new SendMoblabScreenshotRequest();
        request.setContactEmail(contact_email);
        request.setDescription(description);
        if (screenshot) {
            // screenshot is optional in the feedback modal
            request.setScreenshot(screenshot.substring(screenshot.indexOf(',') + 1));
        }
        this.moblabRpcService.send_moblab_screenshot(request, {}, (err, response) => {
            if (err) {
                error_callback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    /** Generic run suite method that can run any of the specific suites defined below
     *  ( with no suite-specific options ).
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param suite_name: ex. CTS, GTS.
     *  @param build: String name of build the suite is being run under.
     *  @param buildtarget: ex. XXX-release/R99-99999.9.9
     *  @param model: Device model.
     *  @param pool: String identifer of a group of DUTs
     *    (as configured in the 'Manage DUTs' component )
     * */
    runSuite(callback, error_callback, suite_name, build, milestone, buildtarget, model, pool) {
        const request = new RunSuiteRequest();
        request.setSuite(suite_name);
        request.setBuildVersion(build);
        request.setMilestone(milestone);
        request.setBuildTarget(buildtarget);
        request.setModel(model);
        request.setPool(pool);
        this.moblabRpcService.run_suite(request, {}, (err, response) => {
            if (err) {
                error_callback(err, response);
            }
            else {
                callback(response);
            }
        });
    }
    /** Starts CTS suite run.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param android_version: ex. String identifier indicating the android
     *    version the CTS suite is being run for (ex. CTS_N ).
     *  @param build: String name of build the suite is being run under.
     *  @param buildtarget: ex. XXX-release/R99-99999.9.9
     *  @param model: Device model.
     *  @param pool: String identifer of a group of DUTs
     *    (as configured in the 'Manage DUTs' component ).
     *  @param specific_modules_list: Comma separated string containing names of
     *    CTS modules. If not empty, only modules in this list will be run as a
     *    part of suite execution.
     * */
    runCtsSuite(callback, error_callback, android_version, build, milestone, buildtarget, model, pool, specific_modules_list) {
        const request = new RunCtsSuiteRequest();
        request.setAndroidVersion(android_version);
        request.setBuildVersion(build);
        request.setBuildTarget(buildtarget);
        request.setMilestone(milestone);
        request.setModel(model);
        request.setPool(pool);
        request.setSpecificModulesList(specific_modules_list);
        this.moblabRpcService.run_cts_suite(request, {}, (err, response) => {
            if (err) {
                error_callback(err, response);
            }
            else {
                callback(response);
            }
        });
    }
    /** Starts GTS suite run.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param build: String name of build the suite is being run under.
     *  @param buildtarget: ex. XXX-release/R99-99999.9.9
     *  @param model: Device model.
     *  @param pool: String identifer of a group of DUTs
     *    (as configured in the 'Manage DUTs' component ).
     *  @param specific_modules_list: Comma separated string containing names ofss
     *    GTS modules. If not empty, only modules in this list will be run as a
     *    part of suite execution.
     * */
    runGtsSuite(callback, error_callback, build, milestone, buildtarget, model, pool, specific_modules_list) {
        const request = new RunGtsSuiteRequest();
        request.setBuildVersion(build);
        request.setBuildTarget(buildtarget);
        request.setModel(model);
        request.setMilestone(milestone);
        request.setPool(pool);
        request.setSpecificModulesList(specific_modules_list);
        this.moblabRpcService.run_gts_suite(request, {}, (err, response) => {
            if (err) {
                error_callback(err, response);
            }
            else {
                callback(response);
            }
        });
    }
    /** Starts hardware storage qualification suite run.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param build: String name of build the suite is being run under.
     *  @param buildtarget: ex. XXX-release/R99-99999.9.9
     *  @param model: Device model.
     *  @param pool: String identifer of a group of DUTs
     *    (as configured in the 'Manage DUTs' component ).
     *  @param avl_process_bug_id: ID of buganizer issue associated with this
     *    storage qualification run.
     *  @param avl_part_number: Number identifier of part for which qualification
     *    is being run.
     *  @param variation: Number enum that identifies a variation of storage qual
     *    to run.
     *  */
    runStorageQualificationSuite(callback, error_callback, build, milestone, buildtarget, model, pool, avl_process_bug_id, avl_part_number, variation, disk_size_gb, dual_namespace, is_pre_qualified) {
        const request = new RunStorageQualificationSuiteRequest();
        request.setBuildVersion(build);
        request.setMilestone(milestone);
        request.setBuildTarget(buildtarget);
        request.setModel(model);
        request.setPool(pool);
        request.setAvlProcessBugId(avl_process_bug_id);
        request.setAvlPartNumber(avl_part_number);
        request.setVariation(variation);
        request.setDiskSizeGb(disk_size_gb);
        request.setIsDualNamespace(dual_namespace);
        request.setIsPreQualified(is_pre_qualified);
        this.moblabRpcService.run_storage_qualification_suite(request, {}, (err, response) => {
            if (err) {
                error_callback(err, response);
            }
            else {
                callback(response);
            }
        });
    }
    /** Starts hardware memory qualification suite run.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param build: String name of build the suite is being run under.
     *  @param buildtarget: ex. XXX-release/R99-99999.9.9
     *  @param model: Device model.
     *  @param pool: String identifer of a group of DUTs
     *    (as configured in the 'Manage DUTs' component ).
     *  @param avl_process_bug_id: ID of buganizer issue associated with this
     *    qualification run.
     *  @param avl_part_number: Number identifier of part for which qualification
     *    is being run.
     *  */
    runMemoryQualificationSuite(callback, error_callback, build, milestone, buildtarget, model, pool, avl_process_bug_id, avl_part_number) {
        const request = new RunMemoryQualificationSuiteRequest();
        request.setBuildVersion(build);
        request.setMilestone(milestone);
        request.setBuildTarget(buildtarget);
        request.setModel(model);
        request.setPool(pool);
        request.setAvlProcessBugId(avl_process_bug_id);
        request.setAvlPartNumber(avl_part_number);
        this.moblabRpcService.run_memory_qualification_suite(request, {}, (err, response) => {
            if (err) {
                error_callback(err, response);
            }
            else {
                callback(response);
            }
        });
    }
    /** Starts FAFT suite run.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param suite: ex. String identifier indicating the faft suite to run.
     *  @param build: String name of build the suite is being run under.
     *  @param buildtarget: ex. XXX-release/R99-99999.9.9
     *  @param model: Device model.
     *  @param pool: String identifer of a group of DUTs
     *    (as configured in the 'Manage DUTs' component ).
     *  @param specific_test_list: Comma separated string containing names of
     *    tests in the suite. If not empty, only tests in this list will be
     *    run as a part of suite execution.
     * */
    runFAFTSuite(callback, error_callback, suite, build, milestone, buildtarget, model, pool, specific_test_list) {
        const request = new RunFAFTSuiteRequest();
        request.setSuite(suite);
        request.setBuildVersion(build);
        request.setBuildTarget(buildtarget);
        request.setMilestone(milestone);
        request.setModel(model);
        request.setPool(pool);
        request.setSpecificTestsList(specific_test_list);
        this.moblabRpcService.run_faft_suite(request, {}, (err, response) => {
            if (err) {
                error_callback(err, response);
            }
            else {
                callback(response);
            }
        });
    }
    /** Starts FWUPD suite run.
    *  @param callback: function invoked in success scenarios.
    *  @param error_callback: function invoked in failure scenarios.
    *  @param suite: ex. String identifier indicating the faft suite to run.
    *  @param build: String name of build the suite is being run under.
    *  @param buildtarget: ex. XXX-release/R99-99999.9.9
    *  @param model: Device model.
    *  @param pool: String identifer of a group of DUTs
    *    (as configured in the 'Manage DUTs' component ).
    *  @param test_args: set of test args passed to test/suite during the
    *    test execution.
    * */
    runFWUPDSuite(callback, error_callback, suite, build, milestone, buildtarget, model, pool, test_args) {
        const request = new RunFWUPDSuiteRequest();
        request.setSuite(suite);
        request.setBuildVersion(build);
        request.setBuildTarget(buildtarget);
        request.setMilestone(milestone);
        request.setModel(model);
        request.setPool(pool);
        request.setTestArgsList(test_args);
        this.moblabRpcService.run_fwupd_suite(request, {}, (err, response) => {
            if (err) {
                error_callback(err, response);
            }
            else {
                callback(response);
            }
        });
    }
    /** Starts provision suite run.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param build: String name of build the suite is being run under.
     *  @param milestone: String identifer of a milestone.
     *  @param model: Device model.
     *  @param pool: String identifer of a group of DUTs
     *    (as configured in the 'Manage DUTs' component )
     * */
    provisionDuts(callback, error_callback, build, milestone, pool) {
        const request = new ProvisionDutsRequest();
        request.setBuildVersion(build);
        request.setMilestone(milestone);
        request.setPool(pool);
        this.moblabRpcService.provision_duts(request, {}, (err, _) => {
            if (err) {
                error_callback(err.message);
            }
            else {
                callback();
            }
        });
    }
    stageBuildPromise(model, build_target, build_version) {
        return __awaiter(this, void 0, void 0, function* () {
            /** Stage the given build on the bucket configured on this moblab.
             * */
            const request = new StageBuildRequest();
            request.setModel(model);
            request.setBuildTarget(build_target);
            request.setBuildVersion(build_version);
            const response = yield this.moblabRpcServicePromiseClient.stage_build(request);
            return response.getBuildBucket();
        });
    }
    listConnectedDuts(callback, error_callback) {
        const request = new ListConnectedDutsRequest();
        this.moblabRpcService.list_connected_duts(request, {}, (err, response) => {
            if (err) {
                console.log(err);
                error_callback('Failed to fetch DUTs');
            }
            else {
                callback(response.getDutsList());
            }
        });
    }
    getDutDetails(callback, errorHandlingCallback, dut) {
        const request = new GetDutDetailsRequest();
        request.setDut(dut);
        this.moblabRpcService.get_dut_details(request, {}, (err, response) => {
            if (err) {
                console.log('Failed get_dut_details RPC call. Request: ', request, 'Response: ', err);
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getDutDetail());
            }
        });
    }
    getNumJobs(callback, 
    // TODO(b/189210905): It can be a bit awkward to call this method when only
    // 1 or 2 arguments need to be passed. Utilize JS object destructuring to
    // make calling this method more readable.
    id_filter, name_filter, created_time_lt, created_time_gt, status_filter, rel_filter, parent_id_filter, dut_hostname_filter) {
        const request = new GetNumJobsRequest();
        if (id_filter) {
            request.setIdFilter(id_filter);
        }
        if (name_filter) {
            request.setNameFilter(name_filter);
        }
        if (created_time_lt) {
            request.setCreatedTimeLt(created_time_lt);
        }
        if (created_time_gt) {
            request.setCreatedTimeGt(created_time_gt);
        }
        if (status_filter) {
            request.setStatusFilter(status_filter);
        }
        if (rel_filter) {
            request.setRelFilter(rel_filter);
        }
        if (parent_id_filter) {
            request.setParentIdFilter(parent_id_filter);
        }
        if (dut_hostname_filter) {
            request.setDutHostnameFilter(dut_hostname_filter);
        }
        this.moblabRpcService.get_num_jobs(request, {}, (err, response) => {
            if (err) {
                console.log('Failed get_num_jobs RPC call. Request: ', request, 'Response: ', err);
            }
            else {
                callback(response.getNumJobs());
            }
        });
    }
    getJobs(callback, errorHandlingCallback, queryStart, queryLimit, id_filter, name_filter, created_time_lt, created_time_gt, status_filter, rel_filter, parent_id_filter, dut_hostname_filter, sort_by) {
        const request = new GetJobsRequest();
        request.setQueryStart(queryStart);
        request.setQueryLimit(queryLimit);
        if (id_filter) {
            request.setIdFilter(id_filter);
        }
        if (name_filter) {
            request.setNameFilter(name_filter);
        }
        if (created_time_lt) {
            request.setCreatedTimeLt(created_time_lt);
        }
        if (created_time_gt) {
            request.setCreatedTimeGt(created_time_gt);
        }
        if (status_filter) {
            request.setStatusFilter(status_filter);
        }
        if (rel_filter) {
            request.setRelFilter(rel_filter);
        }
        if (parent_id_filter) {
            request.setParentIdFilter(parent_id_filter);
        }
        if (dut_hostname_filter) {
            request.setDutHostnameFilter(dut_hostname_filter);
        }
        if (sort_by) {
            request.setSortBy(sort_by);
        }
        this.moblabRpcService.get_jobs(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
                console.log('Failed get_jobs RPC call. Request: ', request, 'Response: ', err);
            }
            else {
                callback(response.getJobsList());
            }
        });
    }
    getJobIds(callback, errorHandlingCallback, queryStart, queryLimit, id_filter, name_filter, created_time_lt, created_time_gt, status_filter, rel_filter, parent_id_filter, dut_hostname_filter) {
        /**
         *  Calls moblab RPC for a list of job IDs matching given query parameters.
         *  @param callback: Invoked on successful return of job IDs.
         *  @param errorCallback: Invoked on call failures.
         *  @param queryStart: Number representing index for start of returned values.
         *  @param queryLimit: Number representing max number of values to return.
         *  @param id_filter: String filter for job id.
         *  @param name_filter: String filter for job name.
         *  @param created_time_lt: A unix timestamp in seconds granularity the sets
         *         upper bound for jobs returned.
         *  @param created_time_gt: A unix timestamp in seconds granularity the sets
         *         lower bound for jobs returned.
         *  @param status_filter: Job.QueueStatus filter for returned jobs.
         *  @param rel_filter: Job.Relationship (child vs parent) for returned jobs.
         *  @param parent_id_filter: String that filters jobs by parent job id.
         *  @param dut_hostname_filter: String that filters jobs by associated
         *         DUT.
         */
        const request = new GetJobsRequest();
        request.setQueryStart(queryStart);
        request.setQueryLimit(queryLimit);
        if (id_filter) {
            request.setIdFilter(id_filter);
        }
        if (name_filter) {
            request.setNameFilter(name_filter);
        }
        if (created_time_lt) {
            request.setCreatedTimeLt(created_time_lt);
        }
        if (created_time_gt) {
            request.setCreatedTimeGt(created_time_gt);
        }
        if (status_filter) {
            request.setStatusFilter(status_filter);
        }
        if (rel_filter) {
            request.setRelFilter(rel_filter);
        }
        if (parent_id_filter) {
            request.setParentIdFilter(parent_id_filter);
        }
        if (dut_hostname_filter) {
            request.setDutHostnameFilter(dut_hostname_filter);
        }
        this.moblabRpcService.get_job_ids(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getJobIdsList());
            }
        });
    }
    abortJobs(callback, errorHandlingCallback, jobIds) {
        const request = new AbortJobsRequest();
        request.setJobIdsList(jobIds);
        this.moblabRpcService.abort_jobs(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    getJobDetails(callback, errorHandlingCallback, id) {
        const request = new GetJobDetailsRequest();
        request.setId(id);
        this.moblabRpcService.get_job_details(request, {}, (err, response) => {
            if (err) {
                console.log('Failed get_job_details RPC call. Request: ', request, 'Response: ', err);
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getJobDetail());
            }
        });
    }
    listBuildTargetsByModel(model, callback, errorHandlingCallback) {
        /** Returns the build_target(s) associated with the given model.
         *  @param model: target model
         *  @param callback: function invoked in success scenarios.
         *  @param error_callback: function invoked in failure scenarios.
         * */
        const request = new ListBuildTargetsByModelRequest();
        request.setModel(model);
        this.moblabRpcService.list_build_targets_by_model(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getBuildTargetsList());
            }
        });
    }
    listBuildTargetsPromise() {
        return __awaiter(this, void 0, void 0, function* () {
            /** Returns the build_target(s) that the account has access to as promise.
             * */
            const request = new ListBuildTargetsRequest();
            const response = yield this.moblabRpcServicePromiseClient.list_build_targets(request);
            return response.getBuildTargetsList();
        });
    }
    listMilestones(buildtarget, model, callback, errorHandlingCallback) {
        const request = new ListMilestonesRequest();
        request.setBuildTarget(buildtarget);
        request.setModel(model);
        this.moblabRpcService.list_milestones(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                const milestoneNames = [];
                for (const item of response.getMilestonesList()) {
                    milestoneNames.push(item.getValue());
                }
                callback(milestoneNames, response.getIsIncomplete());
            }
        });
    }
    listBuildVersions(buildtarget, model, milestone, label, labelName, callback, errorHandlingCallback) {
        const request = new ListBuildVersionsRequest();
        request.setBuildTarget(buildtarget);
        request.setModel(model);
        request.setMilestone(milestone);
        request.setLabel(label);
        this.moblabRpcService.list_build_versions(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                const buildVersionNames = [];
                for (const item of response.getBuildVersionsList()) {
                    let buildStatus = '';
                    if (item.getStatus() !== BuildItem.BuildStatus.BUILD_STATUS_PASS) {
                        if (item.getStatus() in BUILD_STATUS_MAPPINGS) {
                            buildStatus = BUILD_STATUS_MAPPINGS[item.getStatus()];
                        }
                        else {
                            // Gracefull fallback to Unknown status in case when
                            // BuildItem.BuildStatus changes and this block is not
                            // updated.
                            buildStatus = 'Unknown';
                        }
                    }
                    else if (item.getLabelsList().length !== 0 && item.getLabelsList().includes(labelName)) { // if buildVersion is labeled, set status to recommended
                        buildStatus = BUILD_STATUS_MAPPINGS[BuildItem.BuildStatus.BUILD_STATUS_RECOMMENDED];
                    }
                    buildVersionNames.push({
                        version: item.getValue(),
                        status: buildStatus,
                    });
                }
                callback(buildVersionNames, response.getIsIncomplete());
            }
        });
    }
    listModels(callback, errorHandlingCallback) {
        const request = new ListModelsRequest();
        this.moblabRpcService.list_models(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getModelsList());
            }
        });
    }
    listAccessibleModelsPromise(buildTarget) {
        return __awaiter(this, void 0, void 0, function* () {
            /** Returns the models(s) that the account has access to as promise.
             * */
            const request = new ListAccessibleModelsRequest();
            request.setBuildTarget(buildTarget);
            const response = yield this.moblabRpcServicePromiseClient.list_accessible_models(request);
            return response.getModelsList();
        });
    }
    listPools(callback, errorHandlingCallback, model) {
        const request = new ListPoolsRequest();
        request.setModel((model == null) ? "" : model);
        this.moblabRpcService.list_pools(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getPoolsList());
            }
        });
    }
    enrollDuts(ips, callback, errorCallback) {
        const request = new EnrollDutsRequest();
        request.setIpsList(ips);
        this.moblabRpcService.enroll_duts(request, {}, (err, response) => {
            if (err) {
                errorCallback(err.message);
            }
            else {
                callback();
            }
        });
    }
    unenrollDuts(ips, callback, errorCallback) {
        const request = new EnrollDutsRequest();
        request.setIpsList(ips);
        this.moblabRpcService.unenroll_duts(request, {}, (err, response) => {
            if (err) {
                errorCallback(err.message);
            }
            else {
                callback();
            }
        });
    }
    listConnectedDutsFirmware(callback) {
        const request = new ListConnectedDutsRequest();
        this.moblabRpcService.list_connected_duts_firmware(request, {}, (err, response) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(response);
                callback(response.getDutsList());
            }
        });
    }
    updateFirmwareOnDuts(ips, callback) {
        const request = new UpdateDutsFirmwareRequest();
        request.setIpsList(ips);
        this.moblabRpcService.update_duts_firmware(request, {}, (err, response) => {
            if (err) {
                console.log(err);
            }
            else {
                callback(response.getOutputsList());
            }
        });
    }
    getNumDutTasks(callback, errorHandlingCallback, ip, start_time_gt, end_time_lt) {
        const request = new GetNumDutTasksRequest();
        request.setIp(ip);
        if (start_time_gt) {
            request.setStartTimeGt(start_time_gt);
        }
        if (end_time_lt) {
            request.setEndTimeLt(end_time_lt);
        }
        this.moblabRpcService.get_num_dut_tasks(request, {}, (err, response) => {
            if (err) {
                console.log('Failed get_num_dut_actions RPC call. Request: ', request, 'Response: ', err);
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getNumDutTasks());
            }
        });
    }
    getDutTasks(callback, errorHandlingCallback, ip, queryStart, queryLimit, start_time_gt, end_time_lt) {
        const request = new GetDutTasksRequest();
        request.setIp(ip);
        request.setQueryStart(queryStart);
        request.setQueryLimit(queryLimit);
        if (start_time_gt) {
            request.setStartTimeGt(start_time_gt);
        }
        if (end_time_lt) {
            request.setEndTimeLt(end_time_lt);
        }
        this.moblabRpcService.get_dut_tasks(request, {}, (err, response) => {
            if (err) {
                console.log('Failed get_dut_actions RPC call. Request: ', request, 'Response: ', err);
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getTasksList());
            }
        });
    }
    repairDut(callback, errorHandlingCallback, dut_hostname) {
        const request = new RepairHostRequest();
        request.setDutHostname(dut_hostname);
        this.moblabRpcService.repair_host(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    reverifyDuts(callback, errorHandlingCallback, dut_hostnames) {
        const request = new ReverifyHostRequest();
        request.setDutHostnamesList(dut_hostnames);
        this.moblabRpcService.reverify_host(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    addAttributeToDuts(callback, errorHandlingCallback, dut_ips, key, value) {
        const request = new AddAttributeToDutsRequest();
        request.setDutHostnamesList(dut_ips);
        request.setKey(key);
        request.setValue(value);
        this.moblabRpcService.add_attribute_to_duts(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    removeAttributeFromDuts(callback, errorHandlingCallback, dut_ips, key) {
        const request = new RemoveAttributeFromDutsRequest();
        request.setDutHostnamesList(dut_ips);
        request.setKey(key);
        this.moblabRpcService.remove_attribute_from_duts(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    addLabelToDuts(callback, errorHandlingCallback, dut_ips, label) {
        const request = new AddLabelToDutsRequest();
        request.setDutHostnamesList(dut_ips);
        request.setLabel(label);
        this.moblabRpcService.add_label_to_duts(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    removeLabelFromDuts(callback, errorHandlingCallback, dut_ips, label) {
        const request = new RemoveLabelFromDutsRequest();
        request.setDutHostnamesList(dut_ips);
        request.setLabel(label);
        this.moblabRpcService.remove_label_from_duts(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    addPoolToDuts(callback, errorHandlingCallback, dut_ips, pool) {
        /** Sends request to add pool label to given DUTs.
         *  @param callback: function invoked in success scenarios.
         *  @param error_callback: function invoked in failure scenarios.
         *  @param pool: Pool name to be associated with given DUT's
         *  @param dut_ips: Ip's of DUTs who will receive pool label.
         *  */
        const request = new AddPoolToDutsRequest();
        request.setDutHostnamesList(dut_ips);
        request.setPool(pool);
        this.moblabRpcService.add_pool_to_duts(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    removePoolFromDuts(callback, errorHandlingCallback, dut_ips, pool) {
        /** Sends request to remove pool label to given DUTs.
         *  @param callback: function invoked in success scenarios.
         *  @param error_callback: function invoked in failure scenarios.
         *  @param pool: Pool name to be associated with given DUT's
         *  @param dut_ips: Ip's of DUTs who will have pool label removed.
         *  */
        const request = new RemovePoolFromDutsRequest();
        request.setDutHostnamesList(dut_ips);
        request.setPool(pool);
        this.moblabRpcService.remove_pool_from_duts(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    get_network_info(callback, errorHandlingCallback) {
        const request = new GetNetworkInfoRequest();
        this.moblabRpcService.get_network_info(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                console.log('NETWORK RESPONSE: ');
                console.log(response);
                callback(response.getMoblabHostname(), response.getMoblabMacAddress(), response.getIsConnected());
            }
        });
    }
    get_system_info(callback, errorHandlingCallback) {
        const request = new GetSystemInfoRequest();
        this.moblabRpcService.get_system_info(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                console.log('SYSTEM INFO RESPONSE: ');
                console.log(response);
                callback(response.getCpuTemperature());
            }
        });
    }
    get_cloud_configuration(callback, errorHandlingCallback) {
        const request = new GetCloudConfigurationRequest();
        this.moblabRpcService.get_cloud_configuration(request, {}, (err, response) => {
            if (err) {
                // Set Configuration alerting state before calling error handling
                // callback.
                this.configSetupService.setState(false, true);
                errorHandlingCallback(err.message);
            }
            else {
                // Set Configuration alerting state before calling success callback.
                this.configSetupService.setState(response.getIsCloudEnabled(), false);
                callback(response.getBotoKeyId(), response.getBotoKeySecret(), response.getGcsBucketUrl(), response.getIsCloudEnabled(), response.getIsRemoteConsoleEnabled(), response.getIsRemoteCommandEnabled());
            }
        });
    }
    set_cloud_configuration(callback, errorHandlingCallback, boto_key_id, boto_key_secret, gcs_bucket_url, is_cloud_enabled, is_remote_console_enabled, is_remote_command_enabled) {
        const request = new SetCloudConfigurationRequest();
        request.setBotoKeyId(boto_key_id);
        request.setBotoKeySecret(boto_key_secret);
        request.setGcsBucketUrl(gcs_bucket_url);
        request.setIsCloudEnabled(is_cloud_enabled);
        request.setIsRemoteConsoleEnabled(is_remote_console_enabled);
        request.setIsRemoteCommandEnabled(is_remote_command_enabled);
        this.moblabRpcService.set_cloud_configuration(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    get_dut_wifi_info(callback, errorHandlingCallback) {
        const request = new GetDutWifiInfoRequest();
        this.moblabRpcService.get_dut_wifi_info(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getDutWifiName(), response.getDutWifiPassword());
            }
        });
    }
    set_dut_wifi_info(callback, errorHandlingCallback, dut_wifi_name, dut_wifi_password) {
        const request = new SetDutWifiInfoRequest();
        request.setDutWifiName(dut_wifi_name);
        request.setDutWifiPassword(dut_wifi_password);
        this.moblabRpcService.set_dut_wifi_info(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    get_version_info(callback, errorHandlingCallback) {
        const request = new GetVersionInfoRequest();
        this.moblabRpcService.get_version_info(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getMoblabReleaseVersion(), response.getChromeosReleaseVersion(), response.getChromeosReleaseTrack(), response.getChromeosReleaseDescription(), response.getMoblabInstallId(), response.getMoblabSerialNumber());
            }
        });
    }
    reboot_moblab(error_callback) {
        this.moblabRpcService.reboot_moblab(new RebootMoblabRequest(), {}, (err, response) => {
            if (err) {
                error_callback(err.message);
            }
            else {
                console.log(response);
            }
        });
    }
    get_is_update_available(
    /**
     * Get whether an update is available for the Moblab to pull.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  */
    callback, error_callback) {
        this.moblabRpcService.get_is_update_available(new GetIsUpdateAvailableRequest(), {}, (err, response) => {
            if (err) {
                error_callback(err.message);
            }
            else {
                callback(response.getIsUpdateAvailable());
            }
        });
    }
    update_moblab(callback, error_callback) {
        /**
         *  Invoke a moblab update.
         *  @param callback: function invoked in success scenarios.
         *  @param error_callback: function invoked in failure scenarios.
         *  */
        this.moblabRpcService.update_moblab(new UpdateMoblabRequest(), {}, (err, response) => {
            if (err) {
                error_callback(err.message);
            }
            else {
                callback(response.getMessage());
            }
        });
    }
    /**
     *  Gets the Remote Agent configuration.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  */
    get_remote_agent_configuration(callback, errorHandlingCallback) {
        const request = new GetRemoteAgentConfigurationRequest();
        this.moblabRpcService.get_remote_agent_configuration(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getIsEnabled());
            }
        });
    }
    /**
     *  Sets the Remote Agent configuration.
     *  @param callback: function invoked in success scenarios.
     *  @param error_callback: function invoked in failure scenarios.
     *  @param is_enabled: if remote agent is enabled or not.
     *  */
    set_remote_agent_configuration(callback, errorHandlingCallback, is_enabled) {
        const request = new SetRemoteAgentConfigurationRequest();
        request.setIsEnabled(is_enabled);
        this.moblabRpcService.set_remote_agent_configuration(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response.getIsSucceeded());
            }
        });
    }
    /**
     * Validate storage qual setup
     */
    validateStorageQualSetup(callback, errorHandlingCallback, model, board, pool_name = null) {
        const request = new ValidateStorageQualSetupRequest();
        request.setModel(model);
        request.setBoard(board);
        request.setPoolName(pool_name);
        this.moblabRpcService.validate_storage_qual_setup(request, {}, (err, _) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback();
            }
        });
    }
    addServo(callback, errorHandlingCallback, dut_hostname, servo_serial_number) {
        const request = new AddServoRequest();
        request.setDutHostname(dut_hostname);
        request.setServoSerialNumber(servo_serial_number);
        this.moblabRpcService.add_servo(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback();
            }
        });
    }
    getCloudBucketUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            const version = yield new Promise((resolve, reject) => {
                this.get_version_info((_moblab_release_version, _chromeos_release_version, _chromeos_release_track, _chromeos_release_description, moblab_install_id, moblab_serial_number) => {
                    resolve(`${moblab_serial_number}/${moblab_install_id}`);
                }, (errorMsg) => {
                    reject(errorMsg);
                });
            });
            const bucket = yield new Promise((resolve, reject) => {
                this.get_cloud_configuration((_boto_key_id, _boto_key_secret, gcs_bucket_url, _is_cloud_enabled, _is_remote_console_enabled, _is_remote_command_enabled) => {
                    if (gcs_bucket_url && gcs_bucket_url.startsWith('gs://'))
                        resolve(gcs_bucket_url.substr(5));
                }, (errorMsg) => reject(errorMsg));
            });
            return `https://console.cloud.google.com/storage/browser/${bucket}results/${version}`;
        });
    }
    getPeripheralInformation(dut_ip, callback, errorHandlingCallback) {
        const request = new GetPeripheralInformationRequest();
        request.setDutHostname(dut_ip);
        this.moblabRpcService.get_peripheral_information(request, {}, (err, response) => {
            if (err) {
                errorHandlingCallback(err.message);
            }
            else {
                callback(response);
            }
        });
    }
};
MoblabGrpcService = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [ConfigSetupService])
], MoblabGrpcService);
export { MoblabGrpcService };
//# sourceMappingURL=../../../app/services/moblab-grpc.service.js.map