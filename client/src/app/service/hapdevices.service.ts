import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HapAppliance, HapApplianceServiceResponse } from '../store/models';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root',
})
export class HapDevicesService {
  api: string;

  constructor(
    private http: HttpClient,
    private application: ApplicationService
  ) {
    this.api = application.api;
  }

  loadHapDevices() {
    return this.http.get<HapAppliance[]>(`${this.api}/devices`);
  }

  loadCompatibleCCUDevices() {
    return this.http.get<HapAppliance[]>(`${this.api}/ccudevices`);
  }

  loadServiceData(channelAddress: string) {
    return this.http.get<HapApplianceServiceResponse>(`${this.api}/service/${channelAddress}`);
  }

  saveHapDevice(appliance: HapAppliance) {
    return this.http.patch<HapAppliance>(`${this.api}/device`, appliance);
  }
}
