var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MoblabGrpcService } from 'app/services/moblab-grpc.service';
import { ViewDutsComponent } from '../view-duts/view-duts.component';
import { NotificationsService } from 'app/services/notifications.service';
let EditAttributesComponent = class EditAttributesComponent {
    constructor(moblabGrpcService, notificationsService) {
        this.moblabGrpcService = moblabGrpcService;
        this.notificationsService = notificationsService;
        this.attribute_key = new FormControl('');
        this.attribute_value = new FormControl('');
        this.label = new FormControl('');
        this.pool = new FormControl('');
    }
    get_confirmation_message_suffix(dut_hostnames) {
        let confirmation_message_suffix = '';
        // Listing explicit hostnames only if the # of selected hostnames is low.
        if (dut_hostnames.length < 3) {
            confirmation_message_suffix += dut_hostnames;
        }
        else {
            confirmation_message_suffix +=
                dut_hostnames.length.toString() + ' selected DUTs';
        }
        return confirmation_message_suffix;
    }
    doEdit(editFunc) {
        /**
         * This method is the point of entry for all of the edit functionality that
         * is provided in this component. There is some logic common to all of the
         * edit actions provided. Logic unique to each action is to be written in
         * 'editFunc'
         */
        const dut_hostnames = this.dutsTableRef.getSelectedDutHostnames();
        if (dut_hostnames.length === 0) {
            this.notificationsService.notify('No DUTs selected.');
            return;
        }
        editFunc(dut_hostnames, this);
        this.dutsTableRef.unselectAll();
        this.attribute_key.setValue('');
        this.attribute_value.setValue('');
        this.label.setValue('');
        this.pool.setValue('');
    }
    addAttribute(dut_hostnames, context) {
        const confirmation_message = 'Adding attribute ' +
            context.attribute_key.value +
            ':' +
            context.attribute_value.value +
            ' to ' +
            context.get_confirmation_message_suffix(dut_hostnames);
        context.notificationsService.notify(confirmation_message);
        context.moblabGrpcService.addAttributeToDuts(message => {
            context.notificationsService.notify(message);
            context.dutsTableRef.refreshConnectedDuts();
        }, message => {
            context.notificationsService.error(message);
        }, context.dutsTableRef.getSelectedDutHostnames(), context.attribute_key.value.trim(), context.attribute_value.value.trim());
    }
    removeAttribute(dut_hostnames, context) {
        const confirmation_message = 'Removing attribute ' +
            context.attribute_key.value +
            ' from ' +
            context.get_confirmation_message_suffix(dut_hostnames);
        context.notificationsService.notify(confirmation_message);
        context.moblabGrpcService.removeAttributeFromDuts(message => {
            context.notificationsService.notify(message);
            context.dutsTableRef.refreshConnectedDuts();
        }, message => {
            context.notificationsService.error(message);
        }, context.dutsTableRef.getSelectedDutHostnames(), context.attribute_key.value);
    }
    addLabel(dut_hostnames, context) {
        const confirmation_message = 'Adding label ' +
            context.label.value +
            ' to ' +
            context.get_confirmation_message_suffix(dut_hostnames);
        context.notificationsService.notify(confirmation_message);
        context.moblabGrpcService.addLabelToDuts(message => {
            context.notificationsService.notify(message);
            context.dutsTableRef.refreshConnectedDuts();
        }, message => {
            context.notificationsService.error(message);
        }, context.dutsTableRef.getSelectedDutHostnames(), context.label.value.trim());
    }
    removeLabel(dut_hostnames, context) {
        const confirmation_message = 'Removing label ' +
            context.label.value +
            ' from ' +
            context.get_confirmation_message_suffix(dut_hostnames);
        context.moblabGrpcService.removeLabelFromDuts(message => {
            context.notificationsService.notify(message);
            context.dutsTableRef.refreshConnectedDuts();
        }, message => {
            context.notificationsService.error(message);
        }, context.dutsTableRef.getSelectedDutHostnames(), context.label.value);
    }
    addPool(dut_hostnames, context
    /** Initiates Moblab RPC request to add pool label to given DUTs.
     *  Will trigger popup on either success or failure.
     *  @param dut_hostnames: List of DUT hostnames.
     *  @param context: 'this'
     *  */
    ) {
        const confirmation_message = 'Adding pool ' +
            context.pool.value +
            ' to ' +
            context.get_confirmation_message_suffix(dut_hostnames);
        context.notificationsService.notify(confirmation_message);
        context.moblabGrpcService.addPoolToDuts(message => {
            context.notificationsService.notify(message);
            context.dutsTableRef.refreshConnectedDuts();
        }, message => {
            context.notificationsService.error(message);
        }, context.dutsTableRef.getSelectedDutHostnames(), context.pool.value.trim());
    }
    removePool(dut_hostnames, context
    /** Initiates Moblab RPC request to remove pool label to given DUTs.
     *  Will trigger popup on either success or failure.
     *  @param dut_hostnames: List of DUT hostnames.
     *  @param context: 'this'
     *  */
    ) {
        const confirmation_message = 'Removing pool ' +
            context.pool.value +
            ' from ' +
            context.get_confirmation_message_suffix(dut_hostnames);
        context.moblabGrpcService.removePoolFromDuts(message => {
            context.notificationsService.notify(message);
            context.dutsTableRef.refreshConnectedDuts();
        }, message => {
            context.notificationsService.error(message);
        }, context.dutsTableRef.getSelectedDutHostnames(), context.pool.value);
    }
};
__decorate([
    ViewChild(ViewDutsComponent),
    __metadata("design:type", ViewDutsComponent)
], EditAttributesComponent.prototype, "dutsTableRef", void 0);
EditAttributesComponent = __decorate([
    Component({
        selector: 'app-edit-attributes',
        templateUrl: './edit-attributes.component.html',
        styleUrls: ['./edit-attributes.component.css'],
    }),
    __metadata("design:paramtypes", [MoblabGrpcService,
        NotificationsService])
], EditAttributesComponent);
export { EditAttributesComponent };
//# sourceMappingURL=../../../../app/manage-duts/edit-attributes/edit-attributes.component.js.map