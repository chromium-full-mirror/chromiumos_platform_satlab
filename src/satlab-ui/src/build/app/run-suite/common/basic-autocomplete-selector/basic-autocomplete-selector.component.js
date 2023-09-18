var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, EventEmitter, Input, Output, } from '@angular/core';
import { BaseForm } from '../base-form/base-form.component';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
export class SelectableItem {
    constructor(text, status = '', value = null) {
        this.text = text;
        this.status = status;
        this.value = value;
    }
}
/**
 * Autocomplete selector to be used in run suite forms.
 */
let BasicAutocompleteSelectorComponent = class BasicAutocompleteSelectorComponent extends BaseForm {
    constructor() {
        super(...arguments);
        // i.e., if only one option is available, select it.
        this.autoselect = true;
        this.select = new EventEmitter();
        this.unselect = new EventEmitter();
        this.errorMsg = '';
        this.optionSelected = false;
        this.selectFormControl = new FormControl();
        this.selectValueOnUnlock = '';
    }
    // Sets up the subscription to the input form control which generates the
    // filtered options dropdown.
    setFilterOptions() {
        this.filteredOptions = this.selectFormControl.valueChanges.pipe(startWith(''), map(value => this.getFilteredOptions(value)));
    }
    getFilteredOptions(value) {
        const filterResults = this.options;
        // if (value) {
        //   value = value.toLowerCase();
        //   filterResults = this.options.filter(option => option.toLowerCase().includes(value));
        // }
        // if (this.options.length && filterResults.length === 0) {
        //   this.setError("Input does not match with any options.");
        // } else if (filterResults.length !== 0) {
        //   this.clearError();
        // }
        return filterResults;
    }
    // If only one option is available, it is automatically selected.
    autoSelectedSingleOption() {
        if (this.autoselect && this.options.filter(o => o.text).length === 1) {
            this.selectFormControl.setValue(this.options.filter(o => o.text)[0].text);
            this.lock();
            this.select.emit({ value: this.selectFormControl.value });
        }
    }
    _keyUp(event) {
        event.preventDefault();
    }
    onClick() {
        if (this.isLocked() && !this.isDisabled()) {
            this.unlock();
        }
    }
    onOptionSelect(event) {
        this.selectFormControl.setValue(event.option.value.text);
        this.lock();
    }
    onBlur() {
        if (this.isExactMatchToOption() &&
            this.selectFormControl.value !== this.selectValueOnUnlock) {
            this.select.emit({ value: this.selectFormControl.value });
            this.lock();
        }
        else if (this.selectFormControl.value !== this.selectValueOnUnlock) {
            this.unselect.emit();
            this.selectValueOnUnlock = '';
        }
    }
    isExactMatchToOption() {
        return (this.options.findIndex(e => e.text === this.selectFormControl.value) !==
            -1);
    }
    isNextUp() {
        return !this.selectFormControl.disabled && !this.selectFormControl.value;
    }
    enable() {
        super.enable();
        this.selectFormControl.enable();
    }
    isLocked() {
        return this.optionSelected;
    }
    lock() {
        this.selectFormControl.disable();
        this.optionSelected = true;
    }
    unlock() {
        this.selectFormControl.enable();
        this.optionSelected = false;
        this.selectValueOnUnlock = this.selectFormControl.value;
    }
    disable(message) {
        super.disable(message);
        this.selectFormControl.disable();
    }
    setError(message) {
        if (!this.isDisabled()) {
            this.errorMsg = message;
        }
    }
    clearError() {
        this.errorMsg = '';
    }
    hasError() {
        return this.errorMsg;
    }
    clearSelection() {
        this.clearError();
        this.selectFormControl.setValue('');
    }
    // Tracks changes in options Input
    ngOnChanges(changes) {
        if (changes.options) {
            this.options = changes.options.currentValue;
            this.setFilterOptions();
            this.autoSelectedSingleOption();
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], BasicAutocompleteSelectorComponent.prototype, "autoselect", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], BasicAutocompleteSelectorComponent.prototype, "options", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BasicAutocompleteSelectorComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BasicAutocompleteSelectorComponent.prototype, "title", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BasicAutocompleteSelectorComponent.prototype, "select", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BasicAutocompleteSelectorComponent.prototype, "unselect", void 0);
BasicAutocompleteSelectorComponent = __decorate([
    Component({
        selector: 'app-basic-autocomplete-selector',
        templateUrl: './basic-autocomplete-selector.component.html',
        styleUrls: ['./basic-autocomplete-selector.component.scss'],
    })
], BasicAutocompleteSelectorComponent);
export { BasicAutocompleteSelectorComponent };
//# sourceMappingURL=../../../../../app/run-suite/common/basic-autocomplete-selector/basic-autocomplete-selector.component.js.map