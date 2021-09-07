import { TestBed } from '@angular/core/testing';
import { HapApplianceApiService } from './hapappliance.service';


describe('HapApplianceApiService', () => {
  let service: HapApplianceApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HapApplianceApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
