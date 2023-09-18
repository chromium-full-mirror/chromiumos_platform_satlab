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
export const CHECKBOX_ID = 'inner-checkbox';
let TableHeaderSelectorComponent = class TableHeaderSelectorComponent {
    constructor() {
        this.checkboxId = CHECKBOX_ID;
        this.selectValue = undefined;
        this.checkboxState = false;
        this.update = new EventEmitter();
        this.standardOptions = ['All', 'None'];
    }
    ngOnInit() { }
    selectionChange() {
        this.update.emit({ selection: this.selectValue });
        if (this.selectValue === this.standardOptions[0]) {
            this.checkboxState = true;
        }
        else if (this.selectValue === this.standardOptions[1]) {
            this.checkboxState = false;
        }
        else {
            this.checkboxState = true;
        }
        this.selectValue = undefined;
    }
    checkboxChange() {
        this.checkboxState = !this.checkboxState;
        this.update.emit({
            selection: this.checkboxState
                ? this.standardOptions[0]
                : this.standardOptions[1],
        });
    }
    setCheckboxState(checkboxState) {
        this.checkboxState = checkboxState;
    }
    getCheckboxState() {
        return this.checkboxState;
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], TableHeaderSelectorComponent.prototype, "options", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TableHeaderSelectorComponent.prototype, "update", void 0);
TableHeaderSelectorComponent = __decorate([
    Component({
        selector: 'app-table-header-selector',
        templateUrl: './table-header-selector.component.html',
        styleUrls: ['./table-header-selector.component.scss'],
    }),
    __metadata("design:paramtypes", [])
], TableHeaderSelectorComponent);
export { TableHeaderSelectorComponent };
//# sourceMappingURL=../../../../app/widgets/table-header-selector/table-header-selector.component.js.map