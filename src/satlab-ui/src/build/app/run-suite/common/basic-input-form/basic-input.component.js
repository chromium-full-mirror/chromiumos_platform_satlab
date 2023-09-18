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
import { FormControl } from '@angular/forms';
import { BaseForm } from '../base-form/base-form.component';
import { numericValidator } from '../../../utils/validators';
/**
 * Component meant to be used for input form items in run suite components.
 */
let BasicInputFormComponent = class BasicInputFormComponent extends BaseForm {
    constructor() {
        super(...arguments);
        this.update = new EventEmitter();
        this.input = new FormControl('');
    }
    ngOnInit() {
        if (this.isNumeric) {
            this.setNumericValidation();
        }
        this.input.valueChanges.subscribe(value => {
            this.update.emit(this.input.value);
        });
    }
    setNumericValidation() {
        this.input.setValidators([numericValidator]);
    }
    getInput() {
        return this.input.value;
    }
    clear() {
        this.input.reset();
    }
    getInputFormControl() {
        return this.input;
    }
    enable() {
        super.enable();
        this.input.enable({ emitEvent: false });
    }
    disable(message) {
        super.disable(message);
        this.input.disable();
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], BasicInputFormComponent.prototype, "name", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BasicInputFormComponent.prototype, "isNumeric", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BasicInputFormComponent.prototype, "update", void 0);
BasicInputFormComponent = __decorate([
    Component({
        selector: 'app-basic-input',
        templateUrl: './basic-input.component.html',
        styleUrls: ['./basic-input.component.css'],
    })
], BasicInputFormComponent);
export { BasicInputFormComponent };
//# sourceMappingURL=../../../../../app/run-suite/common/basic-input-form/basic-input.component.js.map