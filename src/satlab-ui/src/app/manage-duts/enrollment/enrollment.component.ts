import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IDut} from "../../models/dut";
import {SatlabRpcService} from "../../services/satlab-rpc.service";

@Component({
  selector: 'app-enrollment',
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.scss']
})
export class EnrollmentComponent {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Output() onDUTsUpdated = new EventEmitter();

  protected selectedDUTs: IDut[] = [];
  protected isDUTSelected = false;

  constructor(private service: SatlabRpcService) {}

  protected onDUTsSelectionChanged(d: IDut[]) {
    this.selectedDUTs = d;
    this.isDUTSelected = d.length > 0;
  }

  private __validate() {
    return this.selectedDUTs.length > 0;
  }

  protected onEnrollClicked() {
    if (!this.__validate()) {
      return ;
    }

    // TODO call an API to add DUTs
  }

  protected onUnEnrollClicked() {
    if (!this.__validate()) {
      return ;
    }

    // TODO call an API to delete DUTs
  }

  protected onReVerifyClicked() {
    if (!this.__validate()) {
      return ;
    }

    // TODO call an API to verify the DUTs
  }

  protected onProvisionDUTs () {
    // TODO show an dialog to let user to provision.
  }
}
