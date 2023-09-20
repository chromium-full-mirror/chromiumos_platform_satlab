var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppSidebarComponent } from './app-sidebar/app-sidebar.component';
export let AppModule = class AppModule {
};
AppModule = __decorate([
    NgModule({
        declarations: [
            AppComponent,
            AppSidebarComponent,
        ],
        imports: [
            AppRoutingModule,
            BrowserAnimationsModule,
            BrowserModule,
            CommonModule,
            FormsModule,
            HttpClientModule,
            LayoutModule,
            MatButtonModule,
            MatCardModule,
            MatCheckboxModule,
            MatChipsModule,
            MatDividerModule,
            MatExpansionModule,
            MatFormFieldModule,
            MatIconModule,
            MatInputModule,
            MatListModule,
            MatMenuModule,
            MatPaginatorModule,
            MatProgressSpinnerModule,
            MatProgressBarModule,
            MatSelectModule,
            MatSidenavModule,
            MatTableModule,
            MatTabsModule,
            MatToolbarModule,
            MatTooltipModule,
            ReactiveFormsModule,
            RouterModule,
        ],
        exports: [
            AppRoutingModule,
            MatCardModule,
            MatMenuModule,
            MatTableModule,
            RouterModule,
        ],
        bootstrap: [AppComponent],
    })
], AppModule);
//# sourceMappingURL=../../app/app.module.js.map