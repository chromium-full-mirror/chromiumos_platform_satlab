import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {NotificationService} from '../services/notification.service';
import {AuthService} from '../services/auth.service';
import {IBoto} from '../models/boto';
import {finalize, from} from 'rxjs';
import {startWithTap} from '../utils/rxjs_operator';
import {PollDeviceAuthResponse} from '../services/satlabrpc_pb';

const defaultBoto: IBoto = {
  key: '',
  secret: '',
  bucket: '',
};

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  // boto contains the information of legacy cloud configuration.
  protected boto: IBoto = {...defaultBoto};
  protected editingBoto: IBoto = {...defaultBoto};
  protected cloudConfigurationLoading = false;
  protected cloudConfigurationDisable = true;
  protected isAuthenticated = false;
  protected isBotoExpanded = false;
  // True while the legacy BOTO form holds stashed values in editingBoto. The
  // template reads it to decide whether a Cancel button makes sense.
  protected isEditingBoto = false;
  // Identity shown before the user started reconfiguring, so cancelling can
  // put it back.
  private savedUserEmail = '';
  private savedIsOAuthCompleted = false;

  // Google OAuth Device Flow State
  protected isOAuthModalOpen = false;
  protected isOAuthStarting = false;
  protected isOAuthPolling = false;
  protected isOAuthCompleted = false;
  protected userCode = '';
  protected verificationUrl = '';
  protected deviceCode = '';
  protected userEmail = '';
  protected oauthBucket = '';
  protected pollTimer: ReturnType<typeof setTimeout> | null = null;
  protected pollInterval = 5;
  protected pollError = '';
  // Wall-clock deadline of the current device code. Polling gives up at this
  // point even if every request has been failing, so a permanently broken
  // backend cannot leave the loop running for the lifetime of the tab.
  private pollDeadline = 0;
  // Set by ngOnDestroy. An RPC that is still in flight must not touch the
  // component after it has been torn down.
  private isDestroyed = false;
  // Identifies the newest sign-in attempt. A response from an attempt the
  // user already replaced must not touch the UI of the current one.
  private authAttempt = 0;

  constructor(
    private service: SatlabRpcService,
    private auth: AuthService,
    private notification: NotificationService
  ) {}

  async ngOnInit() {
    this.isAuthenticated = await this.auth.isLoggedIn();
    this.loadConfiguration();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.stopPolling();
  }

  protected loadConfiguration() {
    from(this.service.getCloudConfiguration())
      .pipe(
        startWithTap(() => (this.cloudConfigurationLoading = true)),
        finalize(() => (this.cloudConfigurationLoading = false))
      )
      .subscribe({
        next: b => {
          if (b.key !== '') {
            this.boto = b;
            // A box that is running on BOTO keys has to show them. Leaving the
            // accordion collapsed makes a partner think the configuration is
            // gone: before this page had a Google card, the inputs were always
            // visible.
            this.isBotoExpanded = true;
            // Give the Google card its own copy of the bucket, so switching to
            // it after a BOTO edit does not present an empty field.
            this.oauthBucket = b.bucket;
            this.isOAuthCompleted = false;
            this.userEmail = '';
            this.savedIsOAuthCompleted = false;
            this.savedUserEmail = '';
          } else if (b.bucket !== '' && !b.isUserAuthenticated) {
            // Provisioned with a service account and no Google session: an
            // internal box, or a partner that finished the migration.
            this.boto = {
              ...defaultBoto,
              bucket: b.bucket,
            };
            this.oauthBucket = b.bucket;
            this.cloudConfigurationDisable = this.isAuthenticated;
          } else if (b.isUserAuthenticated) {
            this.isOAuthCompleted = true;
            this.userEmail = b.userEmail || '';
            this.savedUserEmail = this.userEmail;
            this.savedIsOAuthCompleted = true;
            this.oauthBucket = b.bucket || '';
            this.boto = {
              ...defaultBoto,
              bucket: b.bucket,
            };
            this.cloudConfigurationDisable = this.isAuthenticated;
          } else {
            this.cloudConfigurationDisable = false;
          }
        },
        error: e => this.notification.error(e, {dismiss: true}),
      });
  }

  // --- Google OAuth Device Flow Methods ---

  protected async onStartGoogleSignIn() {
    const attempt = ++this.authAttempt;
    this.isOAuthModalOpen = true;
    this.isOAuthStarting = true;
    this.pollError = '';
    this.userCode = '';
    this.verificationUrl = '';
    this.deviceCode = '';
    this.oauthBucket = this.oauthBucket || this.boto.bucket || '';

    try {
      const resp = await this.service.startDeviceAuth();
      // The RPC may resolve after the user closed the modal or navigated away.
      // Starting a polling loop for a session nobody is watching would leak a
      // timer that only a page reload could stop.
      if (
        this.isDestroyed ||
        !this.isOAuthModalOpen ||
        attempt !== this.authAttempt
      ) {
        if (attempt === this.authAttempt) {
          this.isOAuthStarting = false;
        }
        return;
      }
      this.pollDeadline = Date.now() + (resp.expiresIn || 900) * 1000;
      this.deviceCode = resp.deviceCode;
      this.userCode = resp.userCode;
      this.verificationUrl = resp.verificationUrl;
      this.pollInterval = resp.interval || 5;
      this.isOAuthStarting = false;
      this.startPolling();
    } catch (e: unknown) {
      if (this.isDestroyed || attempt !== this.authAttempt) {
        return;
      }
      this.isOAuthStarting = false;
      const msg = e instanceof Error ? e.message : String(e);
      this.pollError = msg || 'Failed to initiate Google authentication';
      this.notification.error(this.pollError, {dismiss: true});
      this.closeOAuthModal();
    }
  }

  protected startPolling() {
    this.stopPolling();
    this.isOAuthPolling = true;

    // Each loop belongs to the device code it was started for. A poll from a
    // previous sign-in attempt may still be awaiting its response when a new
    // one starts; comparing the code stops it from scheduling another timer.
    const sessionCode = this.deviceCode;
    const isCurrentSession = () =>
      this.isOAuthPolling && this.deviceCode === sessionCode;

    const poll = async () => {
      if (!isCurrentSession()) {
        return;
      }
      if (this.pollDeadline && Date.now() > this.pollDeadline) {
        this.stopPolling();
        this.pollError = 'The verification code has expired. Please try again.';
        return;
      }
      try {
        const resp = await this.service.pollDeviceAuth(sessionCode);
        if (!isCurrentSession()) {
          return;
        }
        if (resp) {
          if (resp.status === PollDeviceAuthResponse.Status.SUCCESS) {
            this.stopPolling();
            this.isOAuthCompleted = true;
            this.userEmail = resp.authenticatedEmail || '';
            // savedUserEmail/savedIsOAuthCompleted intentionally keep the
            // pre-edit values: the configuration has not been saved yet, so
            // Cancel must still return to what was displayed before.
            this.closeOAuthModal();
            this.cloudConfigurationDisable = false;
            this.notification.info(
              `Signed in as ${
                this.userEmail || 'Google User'
              }. Please verify your GCS bucket and save.`,
              {dismiss: true}
            );
            return;
          } else if (resp.status === PollDeviceAuthResponse.Status.EXPIRED) {
            this.stopPolling();
            this.pollError =
              'The verification code has expired. Please try again.';
            return;
          } else if (resp.status === PollDeviceAuthResponse.Status.DENIED) {
            this.stopPolling();
            this.pollError = 'Access was denied by the user.';
            return;
          } else if (resp.status === PollDeviceAuthResponse.Status.ERROR) {
            this.stopPolling();
            this.pollError =
              resp.errorMessage || 'An error occurred during authentication.';
            return;
          } else if (
            resp.status === PollDeviceAuthResponse.Status.PENDING &&
            resp.errorMessage === 'slow_down'
          ) {
            // RFC 8628 section 3.5: every slow_down adds five seconds to the
            // interval. The server forwards the code in the message field,
            // which PENDING does not otherwise use.
            this.pollInterval += 5;
          }
        }
      } catch (e: unknown) {
        // Transient failure (for example a dropped connection). Keep polling;
        // the device code stays valid until it expires server-side.
      }

      if (isCurrentSession()) {
        this.pollTimer = setTimeout(poll, this.pollInterval * 1000);
      }
    };

    this.pollTimer = setTimeout(poll, this.pollInterval * 1000);
  }

  protected stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.isOAuthPolling = false;
  }

  protected closeOAuthModal() {
    this.stopPolling();
    this.isOAuthModalOpen = false;
  }

  protected async copyUserCode() {
    if (this.userCode) {
      await navigator.clipboard.writeText(this.userCode);
      this.notification.info('Code copied to clipboard!', {dismiss: true});
    }
  }

  /**
   * Normalizes a GCS bucket name by stripping the optional `gs://` scheme and
   * any surrounding whitespace or trailing slashes. Mirrors the sanitization
   * the backend performs so that both agree on the stored value.
   */
  private sanitizeBucketName(bucket: string): string {
    return bucket
      .trim()
      .replace(/^gs:\/\//i, '')
      .replace(/\/+$/, '');
  }

  protected onCompleteOAuthSetup() {
    const bucket = this.sanitizeBucketName(this.oauthBucket);
    if (!bucket) {
      this.notification.error('GCS Bucket name is required.', {dismiss: true});
      return;
    }

    from(this.service.setCloudConfiguration({bucket}))
      .pipe(
        startWithTap(() => (this.cloudConfigurationLoading = true)),
        finalize(() => (this.cloudConfigurationLoading = false))
      )
      .subscribe({
        next: async () => {
          this.closeOAuthModal();
          this.notification.info(
            'Authentication & Cloud configuration successful, rebooting...',
            {
              dismiss: true,
            }
          );
          this.cloudConfigurationDisable = true;
          this.isEditingBoto = false;
          await this.auth.reloadAuthState();
          await this.service.reboot();
        },
        error: e => this.notification.error(e, {dismiss: true}),
      });
  }

  // --- Legacy BOTO Methods ---

  protected onSetCloudConfigurationClicked() {
    from(this.service.setCloudConfiguration(this.trimSpace(this.boto)))
      .pipe(
        startWithTap(() => (this.cloudConfigurationLoading = true)),
        finalize(() => (this.cloudConfigurationLoading = false))
      )
      .subscribe({
        next: async () => {
          this.notification.info('login successful, rebooting...', {
            dismiss: true,
          });
          this.cloudConfigurationDisable = true;
          this.isEditingBoto = false;
          await this.auth.reloadAuthState();
          await this.service.reboot();
        },
        error: e => this.notification.error(e, {dismiss: true}),
      });
  }

  protected editGoogleConfig() {
    // Read the bucket before beginEdit clears the form.
    this.oauthBucket = this.oauthBucket || this.boto.bucket || '';
    this.beginEdit();
    this.isOAuthCompleted = false;
    this.userEmail = '';
  }

  protected editConfig() {
    this.beginEdit();
    this.isBotoExpanded = true;
    // Mirror of editGoogleConfig: picking one card drops the other card's
    // pending identity, so the page never offers two half-finished
    // configurations at once. cancelEditing puts the saved values back.
    this.isOAuthCompleted = false;
    this.userEmail = '';
  }

  /**
   * Unlocks the page for editing, from whichever card the user started.
   *
   * Both cards share cloudConfigurationDisable, so unlocking one unlocks the
   * legacy BOTO inputs as well. That has two consequences this method has to
   * handle for both entry points alike:
   *
   *  - The keys have to be stashed, or Cancel has nothing to put back and the
   *    user is left looking at edits that were never saved.
   *  - The credentials have to be cleared. getCloudConfiguration never returns
   *    the real secret, it returns the placeholder "secret", so an editable
   *    form left holding the loaded values arms the BOTO Submit button with a
   *    credential that would overwrite a working .boto with that placeholder.
   *
   * The bucket is kept. It is not a secret, it is reported back verbatim, and
   * it is what the status line and the Google card read; clearing it only made
   * the user type it again. Submit stays disabled either way, because it also
   * requires the key and the secret.
   */
  private beginEdit() {
    // Guard against re-entry: stashing again while an edit is in flight would
    // overwrite the saved values with the blanked-out form.
    if (!this.isEditingBoto) {
      this.editingBoto = {...this.boto};
      this.isEditingBoto = true;
    }
    this.boto = {...defaultBoto, bucket: this.boto.bucket};
    this.cloudConfigurationDisable = false;
  }

  protected cancelEditing() {
    // Every Cancel button on the page (both Google ones and the BOTO one)
    // locks the whole page, so each has to undo the whole page. Restoring only
    // the BOTO half would leave the Google card showing a cleared identity
    // that the user can no longer edit.
    this.restoreBotoIfEditing();
    this.oauthBucket = this.boto.bucket || '';
    this.isOAuthCompleted = this.savedIsOAuthCompleted;
    this.userEmail = this.savedUserEmail;
    this.cloudConfigurationDisable = true;
  }

  /** Puts back the BOTO values stashed by editConfig, if there are any. */
  private restoreBotoIfEditing() {
    if (!this.isEditingBoto) {
      return;
    }
    this.boto = {...this.editingBoto};
    this.editingBoto = {...defaultBoto};
    this.isEditingBoto = false;
  }

  private trimSpace(o: IBoto) {
    // IBoto gained non-string members (isUserAuthenticated) when the OAuth flow
    // was added, and `false?.trim()` throws instead of short-circuiting. Only
    // strings may be trimmed; everything else is passed through untouched.
    Object.keys(o).forEach(key => {
      if (typeof o[key] === 'string') {
        o[key] = o[key].trim();
      }
    });
    return o;
  }
}
