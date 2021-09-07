import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HapAppliance, HapApplianceServiceResponse, HapAppllianceApiCallResult } from '../store/models';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root',
})
export class HapApplianceApiService {
  api: string;

  constructor(
    private http: HttpClient,
    private application: ApplicationService
  ) {
    this.api = application.api;
  }

  loadHapAppliances() {
    return this.http.get<HapAppllianceApiCallResult>(`${this.api}/appliances`);
  }

  loadCompatibleCCUDevices() {
    return this.http.get<HapAppliance[]>(`${this.api}/ccudevices`);
  }

  loadServiceData(channelAddress: string) {
    return this.http.get<HapApplianceServiceResponse>(`${this.api}/service/${channelAddress}`);
  }

  saveHapAppliance(appliance: HapAppliance) {
    return this.http.patch<HapAppliance>(`${this.api}/appliance`, appliance);
  }
}
