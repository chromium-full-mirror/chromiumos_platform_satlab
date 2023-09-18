var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BaseForm } from '../base-form/base-form.component';
let BasicTextFormComponent = 
/**
 * Component meant to be used for text form items in run suite components.
 * This is a more long-form alternative to input forms.
 */
class BasicTextFormComponent extends BaseForm {
    constructor() {
        super(...arguments);
        this.update = new EventEmitter();
        this.text = new FormControl('');
    }
    getText() {
        return this.text.value;
    }
    getCsvList() {
        const csv_list = [];
        for (const value of this.getText().split(',')) {
            if (value) {
                csv_list.push(value);
            }
        }
        return csv_list;
    }
    getTextFormControl() {
        return this.text;
    }
    clear() {
        this.text.setValue('');
    }
    enable() {
        super.enable();
        this.text.enable();
    }
    disable(message) {
        super.disable(message);
        this.text.disable();
    }
};
__decorate([
    Output(),
    __metadata("design:type", Object)
], BasicTextFormComponent.prototype, "update", void 0);
BasicTextFormComponent = __decorate([
    Component({
        selector: 'app-basic-text-form',
        templateUrl: './basic-text-form.component.html',
        styleUrls: ['./basic-text-form.component.css'],
    })
    /**
     * Component meant to be used for text form items in run suite components.
     * This is a more long-form alternative to input forms.
     */
], BasicTextFormComponent);
export { BasicTextFormComponent };
//# sourceMappingURL=../../../../../app/run-suite/common/basic-text-form/basic-text-form.component.js.map