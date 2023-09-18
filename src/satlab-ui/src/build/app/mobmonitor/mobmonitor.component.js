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
import { Pipe, } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
let MobmonitorPipe = class MobmonitorPipe {
    constructor(sanitizer) {
        this.sanitizer = sanitizer;
    }
    transform(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
};
MobmonitorPipe = __decorate([
    Pipe({ name: 'safe' }),
    __metadata("design:paramtypes", [DomSanitizer])
], MobmonitorPipe);
export { MobmonitorPipe };
let MobmonitorComponent = class MobmonitorComponent {
    constructor() {
        this.title = 'app';
        this.video = 'http://localhost:9991';
    }
};
MobmonitorComponent = __decorate([
    Component({
        selector: 'app-mob-mobmonitor',
        templateUrl: './mobmonitor.component.html',
        styleUrls: ['./mobmonitor.component.scss'],
    })
], MobmonitorComponent);
export { MobmonitorComponent };
//# sourceMappingURL=../../../app/mobmonitor/mobmonitor.component.js.map