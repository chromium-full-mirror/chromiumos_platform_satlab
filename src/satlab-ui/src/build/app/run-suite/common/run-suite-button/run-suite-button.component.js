var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, EventEmitter, Output, } from '@angular/core';
let RunSuiteButtonComponent = 
/**
 * Component meant to be used at the end of all custom run suite forms.
 */
class RunSuiteButtonComponent {
    constructor() {
        this.onClick = new EventEmitter();
        // Default to disabled because suite user generally has to input form items
        // before submission.
        this.disabled = true;
    }
    enable() {
        this.disabled = false;
    }
    disable() {
        this.disabled = true;
    }
    clicked() {
        this.onClick.emit();
    }
    isDisabled() {
        return this.disabled;
    }
};
__decorate([
    Output(),
    __metadata("design:type", Object)
], RunSuiteButtonComponent.prototype, "onClick", void 0);
RunSuiteButtonComponent = __decorate([
    Component({
        selector: 'app-run-suite-button',
        template: `
    <button
      #runSuiteButton
      mat-raised-button
      color="primary"
      [disabled]="this.isDisabled()"
      (click)="clicked()"
    >
      Run Suite
    </button>
  `,
        styleUrls: [],
    })
    /**
     * Component meant to be used at the end of all custom run suite forms.
     */
], RunSuiteButtonComponent);
export { RunSuiteButtonComponent };
//# sourceMappingURL=../../../../../app/run-suite/common/run-suite-button/run-suite-button.component.js.map