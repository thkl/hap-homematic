import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SystemConfig } from '../store/models/SystemConfig.model';
import { ApplicationService } from './application.service';
import { CCUChannelDatapointResult, CCUDeviceLoadingResult, CCUProgramLoadingResult, CCURoom, CCURoomLoadingResult, CCUVariableLoadingResult } from '../store/models';

@Injectable({
  providedIn: 'root'
})
export class SystemconfigService {

  api: string;

  constructor(private http: HttpClient, private application: ApplicationService) {
    this.api = application.api;
  }


  loadSystemConfiguration() {
    return this.http.get<SystemConfig>(`${this.api}/system`);
  }

  loadRooms() {
    return this.http.get<CCURoomLoadingResult>(`${this.api}/ccurooms`);
  }

  loadCompatibleCCUDevices() {
    return this.http.get<CCUDeviceLoadingResult>(`${this.api}/ccudevices`);
  }


  loadCompatibleCCUVariables() {
    return this.http.get<CCUVariableLoadingResult>(`${this.api}/ccuvariables`);
  }

  loadCompatibleCCUPrograms() {
    return this.http.get<CCUProgramLoadingResult>(`${this.api}/ccuprograms`);
  }

  loadDevicesByChannelTypes(channelTypes: string[]) {
    const typeList = channelTypes.join(',');
    return this.http.get<CCUDeviceLoadingResult>(`${this.api}/ccuchannels/${typeList}`);
  }

  loadChannelDatapoints(channelId: string) {
    return this.http.get<CCUChannelDatapointResult>(`${this.api}/ccudatapoints/${channelId}`)
  }
}
