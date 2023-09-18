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
/**
 * Component meant to be used for checkbox form items in run suite components.
 */
let BasicCheckboxFormComponent = class BasicCheckboxFormComponent extends BaseForm {
    constructor() {
        super(...arguments);
        this.update = new EventEmitter();
        this.checkForm = new FormControl('');
    }
    ngOnInit() {
        this.checkForm.setValue(false);
        this.checkForm.valueChanges.subscribe(value => {
            this.update.emit(this.checkForm.value);
        });
    }
    getChecked() {
        return this.checkForm.value;
    }
    enable() {
        super.enable();
        this.checkForm.enable();
    }
    disable(message) {
        super.disable(message);
        this.checkForm.disable();
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], BasicCheckboxFormComponent.prototype, "name", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BasicCheckboxFormComponent.prototype, "update", void 0);
BasicCheckboxFormComponent = __decorate([
    Component({
        selector: 'app-basic-checkbox',
        templateUrl: './basic-checkbox.component.html',
        styleUrls: ['./basic-checkbox.component.css'],
    })
], BasicCheckboxFormComponent);
export { BasicCheckboxFormComponent };
//# sourceMappingURL=../../../../../app/run-suite/common/basic-checkbox/basic-checkbox.component.js.map