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
const DISABLED_NAME = 'This form is disabled.';
/**
 * Class meant to parent all custom form items for suite runs. (e.g., selectors
 *  input forms, etc ).
 */
let BaseForm = class BaseForm {
    constructor() {
        this.disabled = false;
        this.disabledReasonMessage = DISABLED_NAME;
    }
    enable() {
        this.disabled = false;
        this.disabledReasonMessage = '';
    }
    disable(message) {
        this.disabled = true;
        this.disabledReasonMessage = message ? message : DISABLED_NAME;
    }
    getDisabledReason() {
        return this.disabledReasonMessage;
    }
    isDisabled() {
        return this.disabled;
    }
};
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BaseForm.prototype, "isShown", void 0);
BaseForm = __decorate([
    Component({ template: '' }),
    __metadata("design:paramtypes", [])
], BaseForm);
export { BaseForm };
//# sourceMappingURL=../../../../../app/run-suite/common/base-form/base-form.component.js.map