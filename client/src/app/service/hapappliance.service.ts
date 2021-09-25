import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { HapAppliance, HapApplianceServiceResponse, HapApplianceLoadResult, HapApplianceSaveResult, HapApplianceDeletingResult } from '../store/models';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root',
})
export class HapApplianceApiService {
  api: string;

  constructor(
    private http: HttpClient,
    private application: ApplicationService,
    private logger: NGXLogger
  ) {
    this.api = application.api;
  }

  loadHapAppliances() {
    this.logger.debug('loadHapAppliances');
    return this.http.get<HapApplianceLoadResult>(`${this.api}/appliances`);
  }

  loadServiceData(channelAddress: string, applianceType: string) {
    this.logger.debug(`loadServiceData channelAddress ${channelAddress} applianceType ${applianceType}`);
    return this.http.get<HapApplianceServiceResponse>(`${this.api}/service/${applianceType}/${channelAddress}`);
  }

  saveHapAppliances(appliances: HapAppliance[]) {
    this.logger.debug(`saveHapAppliances appliances`, appliances);
    return this.http.patch<HapApplianceSaveResult>(`${this.api}/appliance`, appliances);
  }

  deleteHapAppliance(appliance: HapAppliance) {
    this.logger.debug(`deleteHapAppliance appliance ${appliance.address}`, appliance);
    return this.http.delete<HapApplianceDeletingResult>(`${this.api}/appliance/${appliance.address}`);
  }
}
