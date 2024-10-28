import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {OpenCCDReply} from 'app/services/satlabrpc_pb';
import {ClientReadableStream} from 'grpc-web';

@Component({
  selector: 'app-open-ccd',
  templateUrl: './open-ccd.component.html',
  styleUrls: ['./open-ccd.component.scss'],
})
export class OpenCcdComponent {
  private readonly servoSerial: string = '';
  protected hintMessage: string = '';
  protected loading = {show: false, message: ''};
  protected rmaAuth: boolean = false;
  protected rmaCode: string = '';
  private stream: ClientReadableStream<OpenCCDReply>;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: {servoSerial: string},
    private dialogRef: MatDialogRef<OpenCcdComponent>,
    private service: SatlabRpcService
  ) {
    this.servoSerial = data.servoSerial;
  }

  private openCCD(servoSerial: string, rmaAuth: boolean) {
    this.loading = {
      show: true,
      message: 'This might take few minutes, please wait....',
    };
    this.stream = this.service.openCCD({
      servoSerial: servoSerial,
      rmaAuth: rmaAuth,
      onData: data => {
        if (data.includes('https://')) {
          this.hintMessage =
            this.hintMessage + `<a href=${data} target="_blank">${data}</a>`;
        } else {
          this.hintMessage = this.hintMessage + `<p>${data}</p>`;
        }
      },
      onError: e => {
        this.hintMessage =
          this.hintMessage + `<p class="ccd-message-error">${e}</p>`;
      },
      finalize: () => {
        this.hintMessage =
          this.hintMessage +
          `<p>Process finished. Click close to continue.</p>`;
        this.loading = {show: false, message: ''};
      },
    });
  }

  private sendMessageToCCDSession(servoSerial: string, message: string) {
    this.service.sendMessageToCCDSession({
      servoSerial: servoSerial,
      message: message,
    });
  }

  protected onStartClicked() {
    this.openCCD(this.servoSerial, this.rmaAuth);
  }

  protected onSubmitClicked() {
    const value = this.rmaCode.trim();
    if (value === '') {
      return;
    }
    this.sendMessageToCCDSession(this.servoSerial, value);
    this.rmaCode = '';
  }

  protected onCloseClicked() {
    this.stream?.cancel();
    this.dialogRef.close();
  }
}
