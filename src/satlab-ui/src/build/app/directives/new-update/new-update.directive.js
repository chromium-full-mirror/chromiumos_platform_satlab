var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NewUpdateDialogComponent } from './new-update-dialog/new-update-dialog.component';
import { Overlay } from '@angular/cdk/overlay';
let NewUpdateDirective = class NewUpdateDirective {
    constructor(dialogRef, overlay) {
        this.dialogRef = dialogRef;
        this.overlay = overlay;
    }
    onClick() {
        this.openNewUpdateDialog();
    }
    openNewUpdateDialog() {
        const dialogRef = this.dialogRef.open(NewUpdateDialogComponent, {
            panelClass: 'c-new-update-dialog',
            backdropClass: 'c-dialog-backdrop',
            disableClose: true,
            height: 'auto',
            width: 'auto',
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
        });
    }
};
__decorate([
    HostListener('click'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NewUpdateDirective.prototype, "onClick", null);
NewUpdateDirective = __decorate([
    Directive({ selector: '[new-update]' }),
    __metadata("design:paramtypes", [MatDialog, Overlay])
], NewUpdateDirective);
export { NewUpdateDirective };
//# sourceMappingURL=../../../../app/directives/new-update/new-update.directive.js.map