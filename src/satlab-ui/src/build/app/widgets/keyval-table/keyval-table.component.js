var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
let KeyValTableComponent = class KeyValTableComponent {
    constructor() {
        this.infoTable = new MatTableDataSource();
        this.tableColumns = ['key', 'value'];
    }
    loadRows(keyvals) {
        const infoRows = [];
        for (const entry of keyvals) {
            infoRows.push({
                key: entry[0],
                value: entry[1],
            });
        }
        this.infoTable = new MatTableDataSource(infoRows);
    }
    isEmpty() {
        return !this.infoTable.data.length;
    }
};
KeyValTableComponent = __decorate([
    Component({
        selector: 'app-keyval-table',
        templateUrl: './keyval-table.component.html',
        styleUrls: ['./keyval-table.component.css'],
    })
], KeyValTableComponent);
export { KeyValTableComponent };
//# sourceMappingURL=../../../../app/widgets/keyval-table/keyval-table.component.js.map