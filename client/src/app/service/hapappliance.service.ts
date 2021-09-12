import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HapAppliance, HapApplianceServiceResponse, HapApplianceLoadResult, HapApplianceSaveResult, HapApplianceDeletingResult } from '../store/models';
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
    return this.http.get<HapApplianceLoadResult>(`${this.api}/appliances`);
  }

  loadServiceData(channelAddress: string, applianceType: string) {
    return this.http.get<HapApplianceServiceResponse>(`${this.api}/service/${applianceType}/${channelAddress}`);
  }

  saveHapAppliance(appliance: HapAppliance) {
    return this.http.patch<HapApplianceSaveResult>(`${this.api}/appliance`, appliance);
  }

  deleteHapAppliance(appliance: HapAppliance) {
    return this.http.delete<HapApplianceDeletingResult>(`${this.api}/appliance/${appliance.address}`);
  }
}
