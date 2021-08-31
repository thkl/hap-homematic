import { TestBed } from '@angular/core/testing';

import { HapdevicesService } from './hapdevices.service';

describe('HapdevicesService', () => {
  let service: HapdevicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HapdevicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
