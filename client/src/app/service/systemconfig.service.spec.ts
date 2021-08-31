import { TestBed } from '@angular/core/testing';

import { SystemconfigService } from './systemconfig.service';

describe('SystemconfigService', () => {
  let service: SystemconfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemconfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
