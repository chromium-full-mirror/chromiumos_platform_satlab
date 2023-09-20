import { TestBed } from '@angular/core/testing';

import { SatlabRpcService } from './satlab-rpc.service';

describe('SatlabRpcService', () => {
  let service: SatlabRpcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SatlabRpcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
