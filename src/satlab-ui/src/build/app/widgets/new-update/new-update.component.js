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
import { NewUpdateService } from '../../services/new-update.service';
import { NewUpdateStatus } from '../../constants';
const mappings = {
    [NewUpdateStatus.UNKNOWN]: {
        icon: 'update_disabled',
        color: 'orange',
        tooltip: 'Error while detemining update availability',
    },
    [NewUpdateStatus.NO_UPDATE]: {
        icon: 'check_circle',
        color: 'green',
        tooltip: 'Moblab is updated',
    },
    [NewUpdateStatus.UPDATE_AVAILABLE]: {
        icon: 'update',
        color: 'yellow',
        tooltip: 'An update is available',
    },
    [NewUpdateStatus.UPDATE_AVAILABLE_WITH_JOBS_RUNNING]: {
        icon: 'update',
        color: 'orange',
        tooltip: 'An update is available but Jobs are currently running',
    },
};
let NewUpdateComponent = class NewUpdateComponent {
    constructor(newUpdateService) {
        this.newUpdateService = newUpdateService;
    }
    ngOnInit() {
        // Subscribe to the Observable provided by NewUpdateService.
        this.newUpdateService.newUpdateStatusObservable.subscribe(data => {
            this.icon = mappings[data['status']].icon;
            this.colorClass = mappings[data['status']].color;
            this.tooltip = mappings[data['status']].tooltip;
        });
    }
};
NewUpdateComponent = __decorate([
    Component({
        selector: 'app-new-update',
        template: `
    <mat-icon
      class="feedback-icon new-update-cursor {{ colorClass }}"
      [matTooltip]="tooltip"
      new-update
      >{{ icon }}</mat-icon
    >
  `,
        styleUrls: ['./new-update.component.css'],
    }),
    __metadata("design:paramtypes", [NewUpdateService])
], NewUpdateComponent);
export { NewUpdateComponent };
//# sourceMappingURL=../../../../app/widgets/new-update/new-update.component.js.map