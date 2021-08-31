import { TestBed } from '@angular/core/testing';

import { HapprogramsService } from './happrograms.service';

describe('HapprogramsService', () => {
  let service: HapprogramsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HapprogramsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
