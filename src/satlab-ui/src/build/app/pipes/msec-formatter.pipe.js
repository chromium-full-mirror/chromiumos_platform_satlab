var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Pipe } from '@angular/core';
import * as moment from 'moment';
let MsecFormatterPipe = class MsecFormatterPipe {
    transform(msec) {
        if (typeof msec === 'undefined' || msec === null) {
            return '--';
        }
        let mm = moment.duration(msec);
        return `
    ${mm.days() > 0 ? `${mm.days()} day(s)` : ''}
    ${mm.hours() > 0 ? ` ${mm.hours()} hour(s)` : ''} 
    ${mm.minutes() > 0 ? ` ${mm.minutes()} minute(s)` : ''} 
    ${mm.seconds() > 0 ? ` ${mm.seconds()} second(s)` : ''} 
    `;
    }
};
MsecFormatterPipe = __decorate([
    Pipe({ name: 'msecFormatter' })
], MsecFormatterPipe);
export { MsecFormatterPipe };
//# sourceMappingURL=../../../app/pipes/msec-formatter.pipe.js.map