import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {AuthService} from './auth.service';
import {SatlabRpcService} from './satlab-rpc.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockRpcService: jasmine.SpyObj<SatlabRpcService>;

  beforeEach(() => {
    mockRpcService = jasmine.createSpyObj('SatlabRpcService', ['isAuth']);
    mockRpcService.isAuth.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {provide: SatlabRpcService, useValue: mockRpcService},
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reload auth state and update login subject', fakeAsync(() => {
    mockRpcService.isAuth.and.returnValue(Promise.resolve(true));

    let loggedInResult: boolean | null = null;
    service.reloadAuthState().then(res => {
      loggedInResult = res;
    });
    tick();

    expect(mockRpcService.isAuth).toHaveBeenCalled();
    expect(loggedInResult).toBeTrue();
    expect((service as any).logSub.getValue()).toBeTrue();
  }));

  it('should update login subject to false when backend is unauthenticated', fakeAsync(() => {
    mockRpcService.isAuth.and.returnValue(Promise.resolve(false));

    let loggedInResult: boolean | null = null;
    service.reloadAuthState().then(res => {
      loggedInResult = res;
    });
    tick();

    expect(mockRpcService.isAuth).toHaveBeenCalled();
    expect(loggedInResult).toBeFalse();
    expect((service as any).logSub.getValue()).toBeFalse();
  }));
});
