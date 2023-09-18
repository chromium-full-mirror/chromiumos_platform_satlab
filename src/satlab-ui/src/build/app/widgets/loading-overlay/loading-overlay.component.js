var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
export var LoadingOverlayStyle;
(function (LoadingOverlayStyle) {
    // renders overlay over entirety of the parent component.
    LoadingOverlayStyle[LoadingOverlayStyle["Center"] = 1] = "Center";
    // renders overlay at the top of the parent component, as a tag.
    LoadingOverlayStyle[LoadingOverlayStyle["Top"] = 2] = "Top";
})(LoadingOverlayStyle || (LoadingOverlayStyle = {}));
let LoadingOverlayComponent = class LoadingOverlayComponent {
    constructor() {
        this.style = LoadingOverlayStyle.Center;
        this.message = '';
        this.hideOverlay = true;
    }
    isCenterOverlay() {
        return this.style === LoadingOverlayStyle.Center;
    }
    isTopOverlay() {
        return this.style === LoadingOverlayStyle.Top;
    }
    updateStatus(message, style = 1) {
        this.message = message;
        this.setStyle(style);
        this.show();
    }
    setStyle(style) {
        this.style = style;
    }
    show() {
        this.hideOverlay = false;
    }
    hide() {
        this.hideOverlay = true;
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], LoadingOverlayComponent.prototype, "style", void 0);
LoadingOverlayComponent = __decorate([
    Component({
        selector: 'app-loading-overlay',
        templateUrl: './loading-overlay.component.html',
        styleUrls: ['./loading-overlay.component.scss'],
    }),
    __metadata("design:paramtypes", [])
], LoadingOverlayComponent);
export { LoadingOverlayComponent };
//# sourceMappingURL=../../../../app/widgets/loading-overlay/loading-overlay.component.js.map