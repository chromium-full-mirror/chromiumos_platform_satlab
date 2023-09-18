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
import { NewUpdateService } from '../../../services/new-update.service';
import { NewUpdateStatus } from '../../../constants';
let NewUpdateNotifierComponent = class NewUpdateNotifierComponent {
    constructor(newUpdateService) {
        this.newUpdateService = newUpdateService;
        this.showNotifier = false;
        this.updateStatus = NewUpdateStatus.UNKNOWN;
    }
    ngOnInit() {
        // Subscribe to the Observable provided by NewUpdateService.
        this.newUpdateService.newUpdateStatusObservable.subscribe(data => {
            this.updateStatus = data['status'];
            this.showNotifier = this.isNewUpdateAvailable();
        });
    }
    isNewUpdateAvailable() {
        return (this.updateStatus === NewUpdateStatus.UPDATE_AVAILABLE ||
            this.updateStatus === NewUpdateStatus.UPDATE_AVAILABLE_WITH_JOBS_RUNNING);
    }
};
NewUpdateNotifierComponent = __decorate([
    Component({
        selector: 'app-new-update-notifier',
        templateUrl: './new-update-notifier.component.html',
        styleUrls: ['./new-update-notifier.component.scss'],
    }),
    __metadata("design:paramtypes", [NewUpdateService])
], NewUpdateNotifierComponent);
export { NewUpdateNotifierComponent };
//# sourceMappingURL=../../../../../app/run-suite/common/new-update-notifier/new-update-notifier.component.js.map