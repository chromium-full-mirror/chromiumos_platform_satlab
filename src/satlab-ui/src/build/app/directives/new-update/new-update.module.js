var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewUpdateDialogComponent } from './new-update-dialog/new-update-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NewUpdateDirective } from './new-update.directive';
let NewUpdateModule = class NewUpdateModule {
};
NewUpdateModule = __decorate([
    NgModule({
        declarations: [NewUpdateDialogComponent, NewUpdateDirective],
        imports: [
            MatDialogModule,
            MatButtonModule,
            MatFormFieldModule,
            MatIconModule,
            MatInputModule,
            MatTooltipModule,
            CommonModule,
            FormsModule,
            MatCheckboxModule,
            MatProgressSpinnerModule,
            ReactiveFormsModule,
        ],
        exports: [NewUpdateDirective],
        entryComponents: [NewUpdateDialogComponent],
        providers: [],
    })
], NewUpdateModule);
export { NewUpdateModule };
//# sourceMappingURL=../../../../app/directives/new-update/new-update.module.js.map