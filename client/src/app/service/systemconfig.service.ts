import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChangeLog, SystemConfig } from '../store/models/SystemConfig.model';
import { ApplicationService } from './application.service';
import { CCUChannelDatapointResult, CCUDeviceLoadingResult, CCUProgramLoadingResult, CCURoomLoadingResult, CCUVariableLoadingResult, CCUVirtualKeylistResult } from '../store/models';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemconfigService {

  api: string;
  rooms$: Observable<CCURoomLoadingResult>;
  configuration$: Observable<SystemConfig>;
  compatibleDevices$: Observable<CCUDeviceLoadingResult>;
  compatibleCCUVariables$: Observable<CCUVariableLoadingResult>;
  compatibleCCUPrograms$: Observable<CCUProgramLoadingResult>;
  compatibleCCUKeys$: Observable<CCUVirtualKeylistResult>;

  constructor(
    private http: HttpClient,
    private application: ApplicationService,
    private logger: NGXLogger) {
    this.api = application.api;

    this.rooms$ = this.http.get<CCURoomLoadingResult>(`${this.api}/ccurooms`, { headers: this.application.httpHeaders() });
    this.configuration$ = this.http.get<SystemConfig>(`${this.api}/system`, { headers: this.application.httpHeaders() });
    this.compatibleDevices$ = this.http.get<CCUDeviceLoadingResult>(`${this.api}/ccudevices`, { headers: this.application.httpHeaders() });
    this.compatibleCCUVariables$ = this.http.get<CCUVariableLoadingResult>(`${this.api}/ccuvariables`, { headers: this.application.httpHeaders() });
    this.compatibleCCUPrograms$ = this.http.get<CCUProgramLoadingResult>(`${this.api}/ccuprograms`, { headers: this.application.httpHeaders() });
    this.compatibleCCUKeys$ = this.http.get<CCUVirtualKeylistResult>(`${this.api}/ccuvirtualkeys`, { headers: this.application.httpHeaders() });
  }


  saveConfig(newConfig: SystemConfig) {
    this.logger.debug('SystemconfigService::saveConfig');
    return this.http.patch<SystemConfig>(`${this.api}/system`, newConfig, { headers: this.application.httpHeaders() });
  }

  loadDevicesByChannelTypes(channelTypes: string[]) {
    const typeList = channelTypes.join(',');
    this.logger.debug(`SystemconfigService::loadDevicesByChannelTypes (${typeList})`);
    return this.http.get<CCUDeviceLoadingResult>(`${this.api}/ccuchannels/${typeList}`, { headers: this.application.httpHeaders() });
  }

  loadChannelDatapoints(channelId: string) {
    this.logger.debug(`SystemconfigService::loadChannelDatapoints (${channelId})`);
    return this.http.get<CCUChannelDatapointResult>(`${this.api}/ccudatapoints/${channelId}`, { headers: this.application.httpHeaders() });
  }



  getLogFile() {
    this.logger.debug('SystemconfigService::getLogFile');
    return this.http.get<string>(`${this.api}/log`, { responseType: 'text' as 'json', headers: this.application.httpHeaders() });
  }

  toggleDebug(enable: boolean) {
    this.logger.debug(`SystemconfigService::toggleDebug (${enable})`);
    return this.http.patch(`${this.api}/debug/${enable}`, { headers: this.application.httpHeaders() });
  }

  getCrashes() {
    this.logger.debug('SystemconfigService::getCrashes');
    return this.http.get<[string]>(`${this.api}/crashes`, { headers: this.application.httpHeaders() });
  }

  getCrashDetail(id: string) {
    this.logger.debug(`SystemconfigService::getCrashDetail (${id})`);
    return this.http.get<string>(`${this.api}/crashes/${id}`, { responseType: 'text' as 'json', headers: this.application.httpHeaders() });
  }

  deleteCrash(id: string) {
    this.logger.debug(`SystemconfigService::deleteCrash (${id})`);
    return this.http.delete<[string]>(`${this.api}/crashes/${id}`, { headers: this.application.httpHeaders() });
  }

  doReboot(enableDebug: boolean) {
    this.logger.debug('SystemconfigService::doReboot', [enableDebug]);
    return this.http.get(`${this.api}/restart/${enableDebug}`, { headers: this.application.httpHeaders() });
  }

  doReset() {
    this.logger.debug('SystemconfigService::doReset');
    return this.http.post(`${this.api}/resetsystem`, {}, { headers: this.application.httpHeaders() });
  }

  doRestore(fileData: any) {
    this.logger.debug('SystemconfigService::doRestore');
    return this.http.post(`${this.api}/restore`, fileData, { headers: this.application.httpHeaders(null) })
  }

  doBackup() {
    this.logger.debug('SystemconfigService::getLogFile');
    return this.http.get<Blob>(`${this.api}/backup`, { observe: 'response', responseType: 'blob' as 'json', headers: this.application.httpHeaders() });
  }

  getChangeLog() {
    this.logger.debug('SystemconfigService::getChangeLog');
    return this.http.get<ChangeLog>(`${this.api}/changelog`, { headers: this.application.httpHeaders() })
  }

  doRefreshCache() {
    this.logger.debug('SystemconfigService::doRefreshCache');
    return this.http.get<any>(`${this.api}/refreshcache`, { headers: this.application.httpHeaders() })
  }

  doGetSupportData(address: string) {
    this.logger.debug('SystemconfigService::doGetSupportData');
    return this.http.get<Blob>(`${this.api}/support/${address}`, { observe: 'response', responseType: 'blob' as 'json', headers: this.application.httpHeaders() });
  }
}
