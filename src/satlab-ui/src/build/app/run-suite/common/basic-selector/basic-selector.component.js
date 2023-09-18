var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, ViewChild, } from '@angular/core';
import { BaseForm } from '../base-form/base-form.component';
import { EventEmitter } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { SelectableItem } from '../basic-autocomplete-selector/basic-autocomplete-selector.component';
/**
 * Selector to be used in run suite forms. Contains logic that should be
 * commonly used across suite forms (e.g., autoselect).
 */
let BasicSelectorComponent = class BasicSelectorComponent extends BaseForm {
    constructor() {
        super(...arguments);
        this.autoselect = true;
        this.options = [];
        this.placeholder = '';
        this.title = '';
        this.recommendedBuild = false;
        this.select = new EventEmitter();
        this.selected = '';
        this.selectableItems = [];
    }
    ngOnInit() {
        this.autoSelectedSingleOption();
    }
    ngOnChanges(changes) {
        if (changes.options) {
            this.options = changes.options.currentValue;
            this.parseOptionsToSelectableItems();
            this.autoSelectedSingleOption();
        }
    }
    parseOptionsToSelectableItems() {
        if (Array.isArray(this.options) && this.options.length >= 1) {
            if (this.options[0] instanceof SelectableItem) {
                this.selectableItems = this.options;
            }
            else if (typeof this.options[0] === 'string') {
                this.selectableItems = this.options.map(e => new SelectableItem(e));
            }
        }
    }
    clearSelection() {
        var _a;
        this.selected = '';
        (_a = this.selector) === null || _a === void 0 ? void 0 : _a.writeValue(null);
    }
    autoSelectedSingleOption() {
        // If the drop down only has one item - auto select it.
        if (this.autoselect && this.selectableItems.length === 1) {
            this.selected = this.selectableItems[0].text;
            this.select.emit({ value: this.selected });
        }
    }
    onChange(event) {
        this.select.emit(event);
    }
    updateStatus(status) {
        this.recommendedBuild = status == 'Recommended';
    }
    selectOption(optionIndex) {
        if (optionIndex >= 0 && optionIndex < this.selectableItems.length) {
            this.selected = this.selectableItems[optionIndex].text;
            this.select.emit({ value: this.selected });
        }
    }
};
__decorate([
    ViewChild(MatSelect),
    __metadata("design:type", MatSelect)
], BasicSelectorComponent.prototype, "selector", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], BasicSelectorComponent.prototype, "autoselect", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], BasicSelectorComponent.prototype, "options", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], BasicSelectorComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], BasicSelectorComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], BasicSelectorComponent.prototype, "recommendedBuild", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BasicSelectorComponent.prototype, "select", void 0);
BasicSelectorComponent = __decorate([
    Component({
        selector: 'app-basic-selector',
        templateUrl: './basic-selector.component.html',
        styleUrls: ['./basic-selector.component.scss'],
    })
], BasicSelectorComponent);
export { BasicSelectorComponent };
//# sourceMappingURL=../../../../../app/run-suite/common/basic-selector/basic-selector.component.js.map