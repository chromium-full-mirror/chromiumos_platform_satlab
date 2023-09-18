var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, EventEmitter, Input, Output } from '@angular/core';
let ButtonWithProgressComponent = class ButtonWithProgressComponent {
    constructor() {
        this.caption = '';
        this.buttonClick = new EventEmitter();
        this.isLoading = false;
    }
    setIsLoadingStatus(isLoading) {
        this.isLoading = isLoading;
    }
    onButtonClick() {
        this.buttonClick.emit();
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], ButtonWithProgressComponent.prototype, "caption", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ButtonWithProgressComponent.prototype, "buttonClick", void 0);
ButtonWithProgressComponent = __decorate([
    Component({
        selector: 'app-button-with-progress',
        templateUrl: './button-with-progress.component.html',
        styleUrls: ['./button-with-progress.component.scss'],
    })
], ButtonWithProgressComponent);
export { ButtonWithProgressComponent };
//# sourceMappingURL=../../../../app/widgets/button-with-progress/button-with-progress.component.js.map