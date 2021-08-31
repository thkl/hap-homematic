import { TestBed } from '@angular/core/testing';

import { HapspecialdevicesService } from './hapspecialdevices.service';

describe('HapspecialdevicesService', () => {
  let service: HapspecialdevicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HapspecialdevicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
