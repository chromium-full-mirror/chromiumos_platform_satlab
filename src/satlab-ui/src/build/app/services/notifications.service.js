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
import { BehaviorSubject, timer } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
export var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["Info"] = 0] = "Info";
    NotificationType[NotificationType["Error"] = 1] = "Error";
})(NotificationType || (NotificationType = {}));
export class Notification {
    constructor(message, type = NotificationType.Info, id = uuidv4()) {
        this.message = message;
        this.type = type;
        this.id = id;
    }
}
let NotificationsService = class NotificationsService {
    constructor() {
        this.notifications = [];
        this.notificationsSubject = new BehaviorSubject(this.notifications);
        this.notificationsObservable = this.notificationsSubject.asObservable();
    }
    notify(message) {
        const notification = new Notification(message, NotificationType.Info);
        this.notifications.push(notification);
        this.pushNotificationsUpdate();
        this.hideInfoMessage(notification.id);
    }
    error(message) {
        this.notifications.push(new Notification(message, NotificationType.Error));
        this.pushNotificationsUpdate();
    }
    dismiss(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.pushNotificationsUpdate();
    }
    pushNotificationsUpdate() {
        this.notificationsSubject.next(this.notifications);
    }
    hideInfoMessage(id) {
        timer(5000).subscribe(_ => this.dismiss(id));
    }
};
NotificationsService = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [])
], NotificationsService);
export { NotificationsService };
//# sourceMappingURL=../../../app/services/notifications.service.js.map