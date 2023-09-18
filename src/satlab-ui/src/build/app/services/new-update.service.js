var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MoblabGrpcService } from './moblab-grpc.service';
import { Job } from './moblabrpc_pb';
import { NewUpdateStatus } from '../constants';
let NewUpdateService = class NewUpdateService {
    constructor(moblabGrpcService) {
        this.moblabGrpcService = moblabGrpcService;
        this.data$ = new BehaviorSubject({
            status: NewUpdateStatus.UNKNOWN,
            reason: 'Service not called.',
        });
        this.newUpdateStatusObservable = this.data$.asObservable();
    }
    pollForUpdates(delay) {
        /**
         * Methods polls for the update status of the Moblab. Must be called at
         * app start up only.
         */
        if (delay === undefined) {
            delay = 300000; // Default delay of 5 minutes.
        }
        this.isUpdateAvailable();
        setTimeout(() => {
            this.pollForUpdates(delay);
        }, delay);
    }
    isUpdateAvailable() {
        /**
         * Method that successively calls required Promises to get the update
         * status of the Moblab in the public Observable.
         */
        this.isUpdateAvailablePromise()
            .then((is_update_available) => {
            if (is_update_available) {
                this.getNumJobsPromise().then((numJobs) => {
                    if (numJobs > 0) {
                        this.data$.next({
                            status: NewUpdateStatus.UPDATE_AVAILABLE_WITH_JOBS_RUNNING,
                            reason: '',
                        });
                    }
                    else {
                        this.data$.next({
                            status: NewUpdateStatus.UPDATE_AVAILABLE,
                            reason: '',
                        });
                    }
                });
            }
            else {
                this.data$.next({
                    status: NewUpdateStatus.NO_UPDATE,
                    reason: '',
                });
            }
        })
            .catch((errorMsg) => {
            this.data$.next({
                status: NewUpdateStatus.UNKNOWN,
                reason: errorMsg,
            });
        });
    }
    isUpdateAvailablePromise() {
        /**
         * Convert the get_is_update_available function into a Promise.
         */
        return new Promise((resolve, reject) => {
            this.moblabGrpcService.get_is_update_available((is_update_available) => {
                resolve(is_update_available);
            }, (errorMsg) => {
                console.log('Failed to get uvailable update information: ' + errorMsg);
                reject(false);
            });
        });
    }
    getNumJobsPromise() {
        /**
         * Convert the getNumJobs function into a Promise.
         */
        return new Promise((resolve, _) => {
            this.moblabGrpcService.getNumJobs((numJobs) => {
                resolve(numJobs);
            }, undefined, // id_filter
            undefined, // name_filter
            undefined, // created_time_lt
            undefined, // created_time_gt
            Job.QueueStatus.JOBS_RUNNING // status_filter
            );
        });
    }
};
NewUpdateService = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __metadata("design:paramtypes", [MoblabGrpcService])
], NewUpdateService);
export { NewUpdateService };
//# sourceMappingURL=../../../app/services/new-update.service.js.map