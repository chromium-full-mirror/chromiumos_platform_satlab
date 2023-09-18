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
import { MoblabConfigurationServicePromiseClient } from './moblab_configuration_rpc_grpc_web_pb';
import { Empty } from './google/protobuf/empty_pb';
import { Duration } from './google/protobuf/duration_pb';
import { PauseHostSchedulerRequest, ResumeHostSchedulerRequest, PauseRequestor, GetStableBuildVersionRequest, ListStableBuildVersionsRequest, SetStableBuildVersionRequest, SetLocalResultsRetentionDurationRequest, StableVersion, } from './moblab_configuration_rpc_pb';
import { MoblabSettingsConstains } from '../constants';
import { environment } from './../../environments/environment';
import { Observable, timer } from 'rxjs';
import { retryWhen, delayWhen } from 'rxjs/operators';
export class StableCrOSVersion {
    constructor() {
        this.DefaultVersion = '';
        this.UserOverrideVersion = '';
    }
}
let MoblabConfigurationGrpcService = class MoblabConfigurationGrpcService {
    constructor() {
        this.configurationRpcClient = null;
        const url = new URL(window.location.href);
        const hostname = environment.defaultHostName || url.hostname;
        const port = environment.defaultApiPort || url.port;
        let service_url = new String(url.protocol);
        service_url = service_url.concat('//', hostname, ':', port, '/rpc');
        console.log(service_url);
        this.configurationRpcClient = new MoblabConfigurationServicePromiseClient('http://100.90.97.114/rpc'
        // service_url.toString()
        );
        this.configurePauseStateObservable();
    }
    /**
     *  Returns a promise that resolves to the list of pause requestors
     *  */
    getPauseState() {
        return this.configurationRpcClient
            .get_host_scheduler_pause_status(new Empty())
            .then((response) => response.getPauserequestorsList().map(this.mapRequestors));
    }
    configurePauseStateObservable() {
        this.pauseStateObservable = new Observable(observer => {
            const stream = this.configurationRpcClient.stream_host_scheduler_pause_status(new Empty());
            stream
                .on('data', (response) => {
                const pauseRequestors = response
                    .getPauserequestorsList()
                    .map(this.mapRequestors);
                console.log(pauseRequestors);
                observer.next(pauseRequestors);
            })
                .on('status', (status) => {
                console.log('Status: Code: ' +
                    status.code +
                    'Details: ' +
                    status.details +
                    'Metadata: ' +
                    status.metadata);
            })
                .on('end', () => {
                console.log('stream_host_scheduler_pause_status stream is closed!');
                observer.error('Stream ended');
            })
                .on('error', er => {
                console.log('Error in stream_host_scheduler_pause_status:', er);
                observer.error(er);
            });
        }).pipe(retryWhen(errors => {
            console.log('Retrying in 60s ... ');
            return errors.pipe(delayWhen(_ => timer(60000)));
        }));
    }
    /**
     *  Request to pause host scheduling.
     *  Returns a promise that resolves to the list of pause requestors.
     *  */
    pauseHostScheduling() {
        const request = new PauseHostSchedulerRequest();
        request.setPauserequestor(PauseRequestor.PAUSE_REQUESTOR_PAUSED_BY_USER);
        return this.configurationRpcClient
            .pause_host_scheduler(request)
            .then((response) => response.getPauserequestorsList().map(this.mapRequestors));
    }
    /**
     *  Request to unpause host scheduling.
     *  Returns a promise that resolves to the list of pause requestors.
     *  */
    resumeHostScheduler() {
        const request = new ResumeHostSchedulerRequest().setPauserequestor(PauseRequestor.PAUSE_REQUESTOR_PAUSED_BY_USER);
        return this.configurationRpcClient
            .resume_host_scheduler(request)
            .then((response) => response.getPauserequestorsList().map(this.mapRequestors));
    }
    getStableBuildVersion(board) {
        const request = new GetStableBuildVersionRequest();
        request.setBoard(board);
        return this.configurationRpcClient
            .get_stable_build_version(request)
            .then((response) => {
            const result = new StableCrOSVersion();
            result.DefaultVersion = response.getStableVersion().getDefaultVersion();
            result.UserOverrideVersion = response
                .getStableVersion()
                .getOverrideVersion();
            return result;
        });
    }
    listStableBuildVersions() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = new ListStableBuildVersionsRequest();
            const response = yield this.configurationRpcClient.list_stable_build_versions(request);
            return response.getBuildTargetStableVersionList();
        });
    }
    setStableBuildVersion(overrideVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = new SetStableBuildVersionRequest();
            request.setStableVersion(new StableVersion().setOverrideVersion(overrideVersion));
            return yield this.configurationRpcClient.set_stable_build_version(request);
        });
    }
    getResultsRetentionPeriod() {
        return this.configurationRpcClient
            .get_local_results_retention_duration(new Empty())
            .then((response) => {
            const hours = response.getDuration().getSeconds() / (60 * 60);
            if (hours < 24 && hours > 0) {
                return `${hours}h`;
            }
            const days = hours / 24;
            if (days < 8 && days > 0) {
                return `${days}d`;
            }
            throw new Error(`Invalid results retention duration: ${hours}`);
        });
    }
    setResultsRetentionPeriod(period) {
        let duration = Number(period.slice(0, -1));
        if (period[period.length - 1] === 'h') {
            duration = duration * 60 * 60; // Convert hours to seconds
        }
        else if (period[period.length - 1] === 'd') {
            duration = duration * 60 * 60 * 24; // Convert days to seconds
        }
        else {
            throw new Error(`Incorrect format of duration: ${period}`);
        }
        const request = new SetLocalResultsRetentionDurationRequest().setDuration(new Duration().setSeconds(duration));
        return this.configurationRpcClient
            .set_local_results_retention_duration(request)
            .then((_) => { });
    }
    mapRequestors(requestor) {
        switch (requestor) {
            case PauseRequestor.PAUSE_REQUESTOR_LOW_DISK_SPACE:
                return MoblabSettingsConstains.LOW_DISK_SPACE_STRING;
            case PauseRequestor.PAUSE_REQUESTOR_PAUSED_BY_USER:
                return MoblabSettingsConstains.USER_REQUEST_STRING;
            default:
                throw new Error('Unkown pause requestor');
        }
    }
};
MoblabConfigurationGrpcService = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [])
], MoblabConfigurationGrpcService);
export { MoblabConfigurationGrpcService };
//# sourceMappingURL=../../../app/services/moblab-configuration-grpc.service.js.map