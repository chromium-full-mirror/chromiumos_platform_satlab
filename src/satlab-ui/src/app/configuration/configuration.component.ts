import {AfterViewInit, Component} from '@angular/core';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {NotificationService} from '../services/notification.service';
import {IBoto} from '../models/boto';
import {finalize, from} from 'rxjs';
import {startWithTap} from '../utils/rxjs_operator';

const defaultBoto: IBoto = {
  key: '',
  secret: '',
  bucket: '',
};

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
})
export class ConfigurationComponent implements AfterViewInit {
  // boto contains the information of cloud configuration.
  protected boto: IBoto = {...defaultBoto};
  protected editingBoto: IBoto = {...defaultBoto};
  protected cloudConfigurationLoading = false;
  protected cloudConfigurationDisable = true;
  protected internalUser = false;

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngAfterViewInit() {
    from(this.service.getCloudConfiguration())
      .pipe(
        startWithTap(() => (this.cloudConfigurationLoading = true)),
        finalize(() => (this.cloudConfigurationLoading = false))
      )
      .subscribe({
        next: b => {
          // we check the get cloud configuration to
          // determine if a user has already logged in
          if (b.key !== '') {
            this.boto = b;
          } else if (b.key === '' && b.bucket !== '') {
            this.internalUser = true;
            this.boto = {
              ...defaultBoto,
              bucket: b.bucket,
            };
          } else {
            this.cloudConfigurationDisable = false;
          }
        },
        error: e => this.notification.error(e, {dismiss: true}),
      });
  }

  /**
   * an event handler that handle the cloud configuration button clicked.
   * @protected
   */
  protected onSetCloudConfigurationClicked() {
    from(this.service.setCloudConfiguration(this.trimSpace(this.boto)))
      .pipe(
        startWithTap(() => (this.cloudConfigurationLoading = true)),
        finalize(() => (this.cloudConfigurationLoading = false))
      )
      .subscribe({
        next: async _ => {
          this.notification.info('login successful, rebooting...', {
            dismiss: true,
          });
          this.cloudConfigurationDisable = true;
          // reboot after we log in successfully
          await this.service.reboot();
        },
        error: e => this.notification.error(e, {dismiss: true}),
      });
  }

  /**
   * an event handler edits the boto key configuration.
   * Copy the original Boto key to `editingBoto` and then clear it.
   * Set the `cloudConfigurationDisable` to false.
   */
  protected editConfig() {
    this.editingBoto = {...this.boto};
    this.boto = {...defaultBoto};
    this.cloudConfigurationDisable = false;
  }

  /**
   * an event handler cancels the boto key configuration editing.
   * Copy back the `editingBoto` to the Boto and then clear it.
   * Set the `cloudConfigurationDisable` to true.
   */
  protected cancelEditing() {
    this.boto = {...this.editingBoto};
    this.editingBoto = {...defaultBoto};
    this.cloudConfigurationDisable = true;
  }

  private trimSpace(o: IBoto) {
    Object.keys(o).forEach(key => (o[key] = o[key]?.trim()));
    return o;
  }
}
