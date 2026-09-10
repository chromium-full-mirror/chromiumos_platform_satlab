import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {ConfigurationComponent} from './configuration.component';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {AuthService} from '../services/auth.service';
import {NotificationService} from '../services/notification.service';
import {PollDeviceAuthResponse} from '../services/satlabrpc_pb';
import {FormsModule} from '@angular/forms';
import {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from '@angular/core';

describe('ConfigurationComponent', () => {
  let component: ConfigurationComponent;
  let fixture: ComponentFixture<ConfigurationComponent>;
  let mockRpcService: jasmine.SpyObj<SatlabRpcService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockRpcService = jasmine.createSpyObj('SatlabRpcService', [
      'getCloudConfiguration',
      'setCloudConfiguration',
      'startDeviceAuth',
      'pollDeviceAuth',
      'reboot',
    ]);

    mockAuthService = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'reloadAuthState',
    ]);

    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'error',
      'info',
      'warn',
      'show',
    ]);

    mockAuthService.isLoggedIn.and.returnValue(Promise.resolve(false));
    mockRpcService.getCloudConfiguration.and.returnValue(
      Promise.resolve({
        key: '',
        secret: '',
        bucket: '',
        userEmail: '',
        isUserAuthenticated: false,
      })
    );

    await TestBed.configureTestingModule({
      declarations: [ConfigurationComponent],
      imports: [FormsModule],
      providers: [
        {provide: SatlabRpcService, useValue: mockRpcService},
        {provide: AuthService, useValue: mockAuthService},
        {provide: NotificationService, useValue: mockNotificationService},
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigurationComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial Load & Session Recovery', () => {
    it('should show unauthenticated state when no config and no user auth', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockAuthService.isLoggedIn).toHaveBeenCalled();
      expect(mockRpcService.getCloudConfiguration).toHaveBeenCalled();
      expect(component['isOAuthCompleted']).toBeFalse();
      expect(component['cloudConfigurationDisable']).toBeFalse();
    }));

    it('should recover active user OAuth session on page load', fakeAsync(() => {
      mockRpcService.getCloudConfiguration.and.returnValue(
        Promise.resolve({
          key: '',
          secret: '',
          bucket: 'partner-bucket',
          userEmail: 'partner@example.com',
          isUserAuthenticated: true,
        })
      );

      fixture.detectChanges();
      tick();

      expect(component['isOAuthCompleted']).toBeTrue();
      expect(component['userEmail']).toBe('partner@example.com');
      expect(component['oauthBucket']).toBe('partner-bucket');
      expect(component['cloudConfigurationDisable']).toBeFalse();
    }));

    it('should populate legacy BOTO fields if legacy config is present', fakeAsync(() => {
      mockRpcService.getCloudConfiguration.and.returnValue(
        Promise.resolve({
          key: 'boto-key-id',
          secret: 'secret',
          bucket: 'partner-bucket',
          userEmail: '',
          isUserAuthenticated: false,
        })
      );

      fixture.detectChanges();
      tick();

      expect(component['boto'].key).toBe('boto-key-id');
      expect(component['boto'].bucket).toBe('partner-bucket');
    }));

    it('should show a service-account box as configured without BOTO keys', fakeAsync(() => {
      mockRpcService.getCloudConfiguration.and.returnValue(
        Promise.resolve({
          key: '',
          secret: '',
          bucket: 'internal-bucket',
          userEmail: '',
          isUserAuthenticated: false,
        })
      );

      fixture.detectChanges();
      tick();

      expect(component['boto'].bucket).toBe('internal-bucket');
      expect(component['boto'].key).toBe('');
      expect(component['isOAuthCompleted']).toBeFalse();
      // No edit has been started, so no Cancel button may be offered.
      expect(component['isEditingBoto']).toBeFalse();
    }));

    it('should handle error when loading cloud configuration fails', fakeAsync(() => {
      mockRpcService.getCloudConfiguration.and.returnValue(
        Promise.reject('RPC Error: service unavailable')
      );

      fixture.detectChanges();
      tick();

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'RPC Error: service unavailable',
        {dismiss: true}
      );
    }));
  });

  describe('Google OAuth Device Flow', () => {
    it('should initiate OAuth Device Flow when onStartGoogleSignIn is called', fakeAsync(() => {
      mockRpcService.startDeviceAuth.and.returnValue(
        Promise.resolve({
          deviceCode: 'dev-123',
          userCode: 'WDJB-MJHT',
          verificationUrl: 'https://www.google.com/device',
          expiresIn: 1800,
          interval: 5,
        })
      );

      component['onStartGoogleSignIn']();
      expect(component['isOAuthModalOpen']).toBeTrue();
      expect(component['isOAuthStarting']).toBeTrue();

      tick();

      expect(component['deviceCode']).toBe('dev-123');
      expect(component['userCode']).toBe('WDJB-MJHT');
      expect(component['verificationUrl']).toBe('https://www.google.com/device');
      expect(component['isOAuthStarting']).toBeFalse();
      expect(component['isOAuthPolling']).toBeTrue();

      component['stopPolling']();
    }));

    it('should handle failure to start OAuth Device Flow', fakeAsync(() => {
      mockRpcService.startDeviceAuth.and.returnValue(
        Promise.reject(new Error('Network failure'))
      );

      component['onStartGoogleSignIn']();
      expect(component['isOAuthStarting']).toBeTrue();

      tick();

      expect(component['isOAuthStarting']).toBeFalse();
      expect(component['pollError']).toBe('Network failure');
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Network failure',
        {dismiss: true}
      );
      expect(component['isOAuthPolling']).toBeFalse();
      expect(component['isOAuthModalOpen']).toBeFalse();
    }));

    it('should handle polling SUCCESS and update authenticated user state', fakeAsync(() => {
      mockRpcService.startDeviceAuth.and.returnValue(
        Promise.resolve({
          deviceCode: 'dev-123',
          userCode: 'WDJB-MJHT',
          verificationUrl: 'https://www.google.com/device',
          expiresIn: 1800,
          interval: 5,
        })
      );
      mockRpcService.pollDeviceAuth.and.returnValue(
        Promise.resolve({
          status: PollDeviceAuthResponse.Status.SUCCESS,
          errorMessage: '',
          authenticatedEmail: 'user@example.com',
        })
      );

      component['onStartGoogleSignIn']();
      tick();

      tick(5000);

      expect(component['isOAuthCompleted']).toBeTrue();
      expect(component['userEmail']).toBe('user@example.com');
      expect(component['isOAuthPolling']).toBeFalse();
      expect(component['isOAuthModalOpen']).toBeFalse();
      expect(component['cloudConfigurationDisable']).toBeFalse();
      expect(mockNotificationService.info).toHaveBeenCalled();
    }));

    it('should handle polling EXPIRED status', fakeAsync(() => {
      mockRpcService.startDeviceAuth.and.returnValue(
        Promise.resolve({
          deviceCode: 'dev-123',
          userCode: 'WDJB-MJHT',
          verificationUrl: 'https://www.google.com/device',
          expiresIn: 1800,
          interval: 5,
        })
      );
      mockRpcService.pollDeviceAuth.and.returnValue(
        Promise.resolve({
          status: PollDeviceAuthResponse.Status.EXPIRED,
          errorMessage: 'Expired',
          authenticatedEmail: '',
        })
      );

      component['onStartGoogleSignIn']();
      tick();
      tick(5000);

      expect(component['pollError']).toContain('expired');
      expect(component['isOAuthPolling']).toBeFalse();
    }));

    it('should handle polling DENIED status', fakeAsync(() => {
      mockRpcService.startDeviceAuth.and.returnValue(
        Promise.resolve({
          deviceCode: 'dev-123',
          userCode: 'WDJB-MJHT',
          verificationUrl: 'https://www.google.com/device',
          expiresIn: 1800,
          interval: 5,
        })
      );
      mockRpcService.pollDeviceAuth.and.returnValue(
        Promise.resolve({
          status: PollDeviceAuthResponse.Status.DENIED,
          errorMessage: 'Access denied',
          authenticatedEmail: '',
        })
      );

      component['onStartGoogleSignIn']();
      tick();
      tick(5000);

      expect(component['pollError']).toBe('Access was denied by the user.');
      expect(component['isOAuthPolling']).toBeFalse();
    }));

    it('should handle polling ERROR status with custom error message', fakeAsync(() => {
      mockRpcService.startDeviceAuth.and.returnValue(
        Promise.resolve({
          deviceCode: 'dev-123',
          userCode: 'WDJB-MJHT',
          verificationUrl: 'https://www.google.com/device',
          expiresIn: 1800,
          interval: 5,
        })
      );
      mockRpcService.pollDeviceAuth.and.returnValue(
        Promise.resolve({
          status: PollDeviceAuthResponse.Status.ERROR,
          errorMessage: 'Authentication failed: invalid_grant',
          authenticatedEmail: '',
        })
      );

      component['onStartGoogleSignIn']();
      tick();
      tick(5000);

      expect(component['pollError']).toBe('Authentication failed: invalid_grant');
      expect(component['isOAuthPolling']).toBeFalse();
    }));

    it('should continue polling on transient polling exception without crashing', fakeAsync(() => {
      mockRpcService.startDeviceAuth.and.returnValue(
        Promise.resolve({
          deviceCode: 'dev-123',
          userCode: 'WDJB-MJHT',
          verificationUrl: 'https://www.google.com/device',
          expiresIn: 1800,
          interval: 5,
        })
      );
      mockRpcService.pollDeviceAuth.and.callFake(() => Promise.reject(new Error('Temporary network drop')));

      component['onStartGoogleSignIn']();
      tick();
      tick(5000);

      // Should still be polling despite the transient error
      expect(component['isOAuthPolling']).toBeTrue();
      component['stopPolling']();
    }));

    it('should copy user code to clipboard when present', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component['userCode'] = 'WDJB-MJHT';

      component['copyUserCode']();
      tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('WDJB-MJHT');
      expect(mockNotificationService.info).toHaveBeenCalledWith(
        'Code copied to clipboard!',
        {dismiss: true}
      );
    }));

    it('should not copy when user code is empty', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component['userCode'] = '';

      component['copyUserCode']();
      tick();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    }));

    it('should stop polling and close modal on closeOAuthModal', fakeAsync(() => {
      component['isOAuthModalOpen'] = true;
      component['isOAuthPolling'] = true;

      component['closeOAuthModal']();

      expect(component['isOAuthModalOpen']).toBeFalse();
      expect(component['isOAuthPolling']).toBeFalse();
    }));

    it('should stop polling on ngOnDestroy', () => {
      spyOn<any>(component, 'stopPolling').and.callThrough();
      component.ngOnDestroy();
      expect(component['stopPolling']).toHaveBeenCalled();
    });
  });

  describe('Completing Setup', () => {
    it('should show error when GCS bucket is empty on OAuth completion', () => {
      component['oauthBucket'] = '   ';
      component['onCompleteOAuthSetup']();

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'GCS Bucket name is required.',
        {dismiss: true}
      );
      expect(mockRpcService.setCloudConfiguration).not.toHaveBeenCalled();
    });

    it('should submit bucket, reload auth, and reboot on valid OAuth completion', fakeAsync(() => {
      mockRpcService.setCloudConfiguration.and.returnValue(Promise.resolve({} as any));
      mockRpcService.reboot.and.returnValue(Promise.resolve({} as any));
      mockAuthService.reloadAuthState.and.returnValue(Promise.resolve(true));

      component['oauthBucket'] = 'my-partner-bucket';
      component['isOAuthModalOpen'] = true;

      component['onCompleteOAuthSetup']();
      tick();

      expect(mockRpcService.setCloudConfiguration).toHaveBeenCalledWith({
        bucket: 'my-partner-bucket',
      });
      expect(mockAuthService.reloadAuthState).toHaveBeenCalled();
      expect(mockRpcService.reboot).toHaveBeenCalled();
      expect(component['isOAuthModalOpen']).toBeFalse();
    }));

    it('should handle error when setCloudConfiguration fails on OAuth completion', fakeAsync(() => {
      mockRpcService.setCloudConfiguration.and.returnValue(
        Promise.reject('Bucket does not exist')
      );

      component['oauthBucket'] = 'invalid-bucket';
      component['onCompleteOAuthSetup']();
      tick();

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Bucket does not exist',
        {dismiss: true}
      );
      expect(mockRpcService.reboot).not.toHaveBeenCalled();
    }));
  });

  describe('Legacy BOTO Configuration', () => {
    it('should submit legacy BOTO credentials and reboot', fakeAsync(() => {
      mockRpcService.setCloudConfiguration.and.returnValue(Promise.resolve({} as any));
      mockRpcService.reboot.and.returnValue(Promise.resolve({} as any));
      mockAuthService.reloadAuthState.and.returnValue(Promise.resolve(true));

      component['boto'] = {
        key: '  key123  ',
        secret: '  secret123  ',
        bucket: '  bucket123  ',
      };

      component['onSetCloudConfigurationClicked']();
      tick();

      expect(mockRpcService.setCloudConfiguration).toHaveBeenCalledWith({
        key: 'key123',
        secret: 'secret123',
        bucket: 'bucket123',
      });
      expect(mockAuthService.reloadAuthState).toHaveBeenCalled();
      expect(mockRpcService.reboot).toHaveBeenCalled();
    }));

    it('should handle error when legacy setCloudConfiguration fails', fakeAsync(() => {
      mockRpcService.setCloudConfiguration.and.returnValue(
        Promise.reject('Invalid credentials')
      );

      component['boto'] = {
        key: 'bad-key',
        secret: 'bad-secret',
        bucket: 'bucket',
      };

      component['onSetCloudConfigurationClicked']();
      tick();

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Invalid credentials',
        {dismiss: true}
      );
      expect(mockRpcService.reboot).not.toHaveBeenCalled();
    }));

    it('should toggle editing state with editConfig and cancelEditing', () => {
      component['boto'] = {key: 'k', secret: 's', bucket: 'b'};
      component['editConfig']();

      expect(component['cloudConfigurationDisable']).toBeFalse();
      expect(component['editingBoto'].key).toBe('k');

      component['cancelEditing']();
      expect(component['cloudConfigurationDisable']).toBeTrue();
      expect(component['boto'].key).toBe('k');
    });

    it('should manage google reconfigure state with editGoogleConfig and cancelEditing', () => {
      component['isAuthenticated'] = true;
      component['boto'] = {key: '', secret: '', bucket: 'orig-bucket'};
      component['oauthBucket'] = 'orig-bucket';
      component['cloudConfigurationDisable'] = true;

      component['editGoogleConfig']();
      expect(component['cloudConfigurationDisable']).toBeFalse();
      expect(component['isOAuthCompleted']).toBeFalse();
      expect(component['userEmail']).toBe('');
      expect(component['oauthBucket']).toBe('orig-bucket');

      component['oauthBucket'] = 'changed-bucket';
      component['cancelEditing']();
      expect(component['cloudConfigurationDisable']).toBeTrue();
      expect(component['oauthBucket']).toBe('orig-bucket');
      expect(component['isOAuthCompleted']).toBeFalse();
    });

    // Regression: the two panels share cloudConfigurationDisable, so editing
    // the BOTO form and then cancelling on the Google card used to leave the
    // keys blanked out with no way to get them back.
    it('should keep legacy BOTO keys when the google panel is cancelled', () => {
      component['boto'] = {key: 'legacy-key', secret: 'legacy-secret', bucket: 'b'};

      component['editConfig']();
      expect(component['boto'].key).toBe('');

      component['cancelEditing']();

      expect(component['boto'].key).toBe('legacy-key');
      expect(component['boto'].secret).toBe('legacy-secret');
      expect(component['cloudConfigurationDisable']).toBeTrue();

      // A second edit round must stash the real values, not the blanks.
      component['editConfig']();
      expect(component['editingBoto'].key).toBe('legacy-key');
      component['cancelEditing']();
      expect(component['boto'].key).toBe('legacy-key');
    });

    it('should not wipe BOTO keys when cancelling without an edit in flight', () => {
      component['boto'] = {key: 'legacy-key', secret: 'legacy-secret', bucket: 'b'};

      component['cancelEditing']();
      expect(component['boto'].key).toBe('legacy-key');

      component['cancelEditing']();
      expect(component['boto'].key).toBe('legacy-key');
    });

    it('should not start polling when the modal is closed mid-request', async () => {
      let resolveStart!: (value: unknown) => void;
      mockRpcService.startDeviceAuth.and.returnValue(
        new Promise(resolve => (resolveStart = resolve)) as never
      );
      const startPolling = spyOn<never>(
        component as never,
        'startPolling' as never
      );

      const pending = component['onStartGoogleSignIn']();
      component['closeOAuthModal']();
      resolveStart({
        deviceCode: 'device-code',
        userCode: 'ABCD-EFGH',
        verificationUrl: 'https://google.com/device',
        expiresIn: 900,
        interval: 5,
      });
      await pending;

      expect(startPolling).not.toHaveBeenCalled();
      expect(component['isOAuthStarting']).toBeFalse();
    });

    it('should ignore a superseded sign-in attempt that fails', async () => {
      let rejectFirst!: (reason: unknown) => void;
      let resolveSecond!: (value: unknown) => void;
      mockRpcService.startDeviceAuth.and.returnValues(
        new Promise((_, reject) => (rejectFirst = reject)) as never,
        new Promise(resolve => (resolveSecond = resolve)) as never
      );
      spyOn<never>(component as never, 'startPolling' as never);

      const first = component['onStartGoogleSignIn']();
      component['closeOAuthModal']();
      const second = component['onStartGoogleSignIn']();

      // The first attempt fails only after the user already restarted the flow.
      // Its error must not tear down the modal the user is looking at now.
      rejectFirst(new Error('network down'));
      await first;
      expect(component['isOAuthModalOpen']).toBeTrue();
      expect(component['pollError']).toBe('');

      resolveSecond({
        deviceCode: 'second-code',
        userCode: 'WXYZ-1234',
        verificationUrl: 'https://google.com/device',
        expiresIn: 900,
        interval: 5,
      });
      await second;
      expect(component['userCode']).toBe('WXYZ-1234');
    });

    it('should restore BOTO keys edited through the google card', () => {
      // Editing from the Google card unlocks the BOTO inputs as well. Whatever
      // the user types there must be undone by Cancel, exactly as it is when
      // the BOTO pencil opened the form.
      component['boto'] = {key: 'REAL_KEY', secret: 'REAL_SECRET', bucket: 'real-bucket'};
      component['savedIsOAuthCompleted'] = false;
      component['savedUserEmail'] = '';
      component['cloudConfigurationDisable'] = true;

      component['editGoogleConfig']();
      component['boto'] = {key: 'TYPO', secret: 'TYPO', bucket: 'typo'};
      component['cancelEditing']();

      expect(component['boto'].key).toBe('REAL_KEY');
      expect(component['boto'].secret).toBe('REAL_SECRET');
      expect(component['boto'].bucket).toBe('real-bucket');
      expect(component['isEditingBoto']).toBeFalse();
    });

    it('should save a legacy BOTO configuration carrying non-string fields', () => {
      // getCloudConfiguration hands back userEmail and isUserAuthenticated as
      // well, and the legacy branch stores that object verbatim. Trimming must
      // not choke on the boolean: `false?.trim()` throws a TypeError and used
      // to take the whole save down for exactly the users on BOTO keys.
      component['boto'] = {
        key: '  BOTO_KEY  ',
        secret: '  BOTO_SECRET  ',
        bucket: '  my-bucket  ',
        userEmail: '',
        isUserAuthenticated: false,
      };
      mockRpcService.setCloudConfiguration.and.returnValue(
        Promise.resolve() as never
      );

      expect(() => component['onSetCloudConfigurationClicked']()).not.toThrow();
      expect(mockRpcService.setCloudConfiguration).toHaveBeenCalledWith(
        jasmine.objectContaining({
          key: 'BOTO_KEY',
          secret: 'BOTO_SECRET',
          bucket: 'my-bucket',
          isUserAuthenticated: false,
        })
      );
    });

    it('should restore the google card when the BOTO cancel is used', () => {
      component['boto'] = {key: '', secret: '', bucket: 'orig-bucket'};
      component['savedUserEmail'] = 'user@domain.com';
      component['savedIsOAuthCompleted'] = true;
      component['isOAuthCompleted'] = true;
      component['userEmail'] = 'user@domain.com';

      component['editGoogleConfig']();
      expect(component['userEmail']).toBe('');

      component['cancelEditing']();

      expect(component['userEmail']).toBe('user@domain.com');
      expect(component['isOAuthCompleted']).toBeTrue();
      expect(component['oauthBucket']).toBe('orig-bucket');
      expect(component['cloudConfigurationDisable']).toBeTrue();
    });

    it('should restore the signed-in identity when reconfigure is cancelled', () => {
      component['isOAuthCompleted'] = true;
      component['userEmail'] = 'user@domain.com';
      component['savedIsOAuthCompleted'] = true;
      component['savedUserEmail'] = 'user@domain.com';

      component['editGoogleConfig']();
      expect(component['userEmail']).toBe('');

      component['cancelEditing']();
      expect(component['userEmail']).toBe('user@domain.com');
      expect(component['isOAuthCompleted']).toBeTrue();
    });

    it('should not leave the placeholder secret in an editable BOTO form', () => {
      // getCloudConfiguration cannot return the real secret, it returns the
      // literal "secret". Reconfiguring from the Google card unlocks the BOTO
      // inputs too, so leaving the loaded values in place would enable BOTO
      // Submit and let one click overwrite a working .boto with "secret".
      component['boto'] = {
        key: 'REAL_KEY',
        secret: 'secret',
        bucket: 'real-bucket',
      };
      component['cloudConfigurationDisable'] = true;

      component['editGoogleConfig']();

      expect(component['cloudConfigurationDisable']).toBeFalse();
      expect(component['boto'].secret).toBe('');
      expect(component['boto'].key).toBe('');
      // The bucket is not a secret and is reported back verbatim, so it stays
      // put in both cards rather than making the user type it again.
      expect(component['boto'].bucket).toBe('real-bucket');
      expect(component['oauthBucket']).toBe('real-bucket');

      component['cancelEditing']();
      expect(component['boto'].secret).toBe('secret');
      expect(component['boto'].key).toBe('REAL_KEY');
    });
  });
});
