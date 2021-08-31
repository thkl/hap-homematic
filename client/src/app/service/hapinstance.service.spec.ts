import { TestBed } from '@angular/core/testing';

import { HapinstanceService } from './hapinstance.service';

describe('HapinstanceService', () => {
  let service: HapinstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HapinstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
