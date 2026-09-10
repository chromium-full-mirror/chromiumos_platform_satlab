import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {SatlabRpcService} from './satlab-rpc.service';
import {
  StartDeviceAuthResponse,
  PollDeviceAuthResponse,
  GetCloudConfigurationResponse,
  SetCloudConfigurationResponse,
} from './satlabrpc_pb';

describe('SatlabRpcService', () => {
  let service: SatlabRpcService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = jasmine.createSpyObj('SatlabRpcServiceClient', [
      'startDeviceAuth',
      'pollDeviceAuth',
      'setCloudConfiguration',
      'getCloudConfiguration',
      'isAuth',
    ]);

    TestBed.configureTestingModule({
      providers: [SatlabRpcService],
    });
    service = TestBed.inject(SatlabRpcService);
    // Inject mockClient into private client field
    (service as any).client = mockClient;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Google OAuth Device Flow RPCs', () => {
    it('should call startDeviceAuth and map response fields correctly', fakeAsync(() => {
      const mockResp = new StartDeviceAuthResponse()
        .setDeviceCode('dev-abc')
        .setUserCode('WDJB-MJHT')
        .setVerificationUrl('https://www.google.com/device')
        .setExpiresIn(1800)
        .setInterval(5);

      mockClient.startDeviceAuth.and.returnValue(Promise.resolve(mockResp));

      let result: any = null;
      service.startDeviceAuth().then(res => {
        result = res;
      });
      tick();

      expect(mockClient.startDeviceAuth).toHaveBeenCalled();
      expect(result).toEqual({
        deviceCode: 'dev-abc',
        userCode: 'WDJB-MJHT',
        verificationUrl: 'https://www.google.com/device',
        expiresIn: 1800,
        interval: 5,
      });
    }));

    it('should call pollDeviceAuth and map status and email', fakeAsync(() => {
      const mockResp = new PollDeviceAuthResponse()
        .setStatus(PollDeviceAuthResponse.Status.SUCCESS)
        .setErrorMessage('')
        .setAuthenticatedEmail('partner@example.com');

      mockClient.pollDeviceAuth.and.returnValue(Promise.resolve(mockResp));

      let result: any = null;
      service.pollDeviceAuth('dev-abc').then(res => {
        result = res;
      });
      tick();

      expect(mockClient.pollDeviceAuth).toHaveBeenCalled();
      expect(result).toEqual({
        status: PollDeviceAuthResponse.Status.SUCCESS,
        errorMessage: '',
        authenticatedEmail: 'partner@example.com',
      });
    }));
  });

  describe('Cloud Configuration RPCs', () => {
    it('should set cloud configuration with bucket only (OAuth flow)', fakeAsync(() => {
      const mockResp = new SetCloudConfigurationResponse();
      mockClient.setCloudConfiguration.and.returnValue(Promise.resolve(mockResp));

      service.setCloudConfiguration({bucket: 'partner-bucket'});
      tick();

      expect(mockClient.setCloudConfiguration).toHaveBeenCalled();
    }));

    it('should get cloud configuration and extract OAuth user info if present', fakeAsync(() => {
      const mockResp = new GetCloudConfigurationResponse()
        .setBotoKeyId('')
        .setGcsBucketUrl('partner-bucket')
        .setUserEmail('partner@example.com')
        .setIsUserAuthenticated(true);

      mockClient.getCloudConfiguration.and.returnValue(Promise.resolve(mockResp));

      let result: any = null;
      service.getCloudConfiguration().then(res => {
        result = res;
      });
      tick();

      expect(mockClient.getCloudConfiguration).toHaveBeenCalled();
      expect(result.bucket).toBe('partner-bucket');
      // The whole point of this case: the two OAuth fields have to survive the
      // mapping. Without these the test passed even with the mapping deleted.
      expect(result.userEmail).toBe('partner@example.com');
      expect(result.isUserAuthenticated).toBeTrue();
      // The real secret never leaves the box; the mapping substitutes a
      // placeholder, and the configuration page relies on that.
      expect(result.secret).toBe('secret');
    }));
  });
});
