import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SystemConfig } from '../store/models/SystemConfig.model';
import { ApplicationService } from './application.service';
import { CCUChannelDatapointResult, CCUDeviceLoadingResult, CCUProgramLoadingResult, CCURoom, CCURoomLoadingResult, CCUVariableLoadingResult } from '../store/models';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class SystemconfigService {

  api: string;

  constructor(
    private http: HttpClient,
    private application: ApplicationService,
    private logger: NGXLogger) {
    this.api = application.api;
  }


  loadSystemConfiguration() {
    this.logger.debug('SystemconfigService::loadSystemConfiguration');
    return this.http.get<SystemConfig>(`${this.api}/system`);
  }

  saveConfig(newConfig: SystemConfig) {
    this.logger.debug('SystemconfigService::saveConfig');
    return this.http.patch<SystemConfig>(`${this.api}/system`, newConfig);
  }

  loadRooms() {
    this.logger.debug('SystemconfigService::loadRooms');
    return this.http.get<CCURoomLoadingResult>(`${this.api}/ccurooms`);
  }

  loadCompatibleCCUDevices() {
    this.logger.debug('SystemconfigService::loadCompatibleCCUDevices');
    return this.http.get<CCUDeviceLoadingResult>(`${this.api}/ccudevices`);
  }


  loadCompatibleCCUVariables() {
    this.logger.debug('SystemconfigService::loadCompatibleCCUVariables');
    return this.http.get<CCUVariableLoadingResult>(`${this.api}/ccuvariables`);
  }

  loadCompatibleCCUPrograms() {
    this.logger.debug('SystemconfigService::loadCompatibleCCUPrograms');
    return this.http.get<CCUProgramLoadingResult>(`${this.api}/ccuprograms`);
  }

  loadDevicesByChannelTypes(channelTypes: string[]) {
    const typeList = channelTypes.join(',');
    this.logger.debug(`SystemconfigService::loadDevicesByChannelTypes (${typeList})`);
    return this.http.get<CCUDeviceLoadingResult>(`${this.api}/ccuchannels/${typeList}`);
  }

  loadChannelDatapoints(channelId: string) {
    this.logger.debug(`SystemconfigService::loadChannelDatapoints (${channelId})`);
    return this.http.get<CCUChannelDatapointResult>(`${this.api}/ccudatapoints/${channelId}`);
  }

  getLogFile() {
    this.logger.debug('SystemconfigService::getLogFile');
    return this.http.get<string>(`${this.api}/log`, { responseType: 'text' as 'json' });
  }

  toggleDebug(enable: boolean) {
    this.logger.debug(`SystemconfigService::toggleDebug (${enable})`);
    return this.http.patch(`${this.api}/debug/${enable}`, {});
  }

  getCrashes() {
    this.logger.debug('SystemconfigService::getCrashes');
    return this.http.get<[string]>(`${this.api}/crashes`);
  }

  getCrashDetail(id: string) {
    this.logger.debug(`SystemconfigService::getCrashDetail (${id})`);
    return this.http.get<string>(`${this.api}/crashes/${id}`, { responseType: 'text' as 'json' });
  }

  deleteCrash(id: string) {
    this.logger.debug(`SystemconfigService::deleteCrash (${id})`);
    return this.http.delete<[string]>(`${this.api}/crashes/${id}`);
  }

  doReboot(enableDebug: boolean) {
    return this.http.get(`${this.api}/restart/${enableDebug}`);
  }

  doReset() {
    return this.http.post(`${this.api}/resetsystem`, {});
  }

}
