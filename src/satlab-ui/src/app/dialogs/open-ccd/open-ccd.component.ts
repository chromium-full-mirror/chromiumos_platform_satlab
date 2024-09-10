import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';

@Component({
  selector: 'app-open-ccd',
  templateUrl: './open-ccd.component.html',
  styleUrls: ['./open-ccd.component.scss'],
})
export class OpenCcdComponent implements OnInit {
  private readonly servoSerial: string = "";
  protected hintMessage: string = "";
  protected loading = {show: false, message: ''};

  constructor(
    @Inject(MAT_DIALOG_DATA) data: {servoSerial: string},
    private dialogRef: MatDialogRef<OpenCcdComponent>,
    private service: SatlabRpcService,
  ) {
    this.servoSerial = data.servoSerial;
  }

  ngOnInit(): void {
    this.openCCD(this.servoSerial)
  }

  private openCCD(servoSerial: string) {
    this.loading = {show: true, message: 'This might take few minutes, please wait...'};
    this.service.openCCD({
      servoSerial: servoSerial,
      onData: (data) => this.hintMessage = this.hintMessage + `<p>${data}</p>`,
      onError: (e) => {
        this.hintMessage = this.hintMessage + `<p class="ccd-message-error">${e}</p>`;
      },
      finalize: () => {
        this.hintMessage = this.hintMessage + `<p>Process finished. Click close to continue.</p>`;
        this.loading = {show: false, message: ''};
      }
    })
  }

  protected onCancelClicked() {
    this.dialogRef.close();
  }
}
