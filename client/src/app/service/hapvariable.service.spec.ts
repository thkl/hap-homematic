import { TestBed } from '@angular/core/testing';

import { HapvariableService } from './hapvariable.service';

describe('HapvariableService', () => {
  let service: HapvariableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HapvariableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
