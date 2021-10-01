import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HapInstance, HapInstanceCoreData, HapInstanceDeletingResult, HapInstanceSavingResult } from '../store/models/HapInstance.model';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root'
})
export class HapinstanceService {
  api: string;

  constructor(private http: HttpClient, private application: ApplicationService) {
    this.api = application.api;
  }


  loadHapInstances() {
    return this.http.get<HapInstance[]>(`${this.api}/instances`, { headers: this.application.httpHeaders() });
  }

  saveHapInstance(instance: HapInstance[]) {
    return this.http.patch<HapInstanceSavingResult>(`${this.api}/instances`, instance, { headers: this.application.httpHeaders() });
  }

  createHapInstance(instance: HapInstanceCoreData[]) {
    return this.http.post<HapInstanceSavingResult>(`${this.api}/instances`, instance, { headers: this.application.httpHeaders() });
  }

  deleteHapInstance(instance: HapInstance) {
    return this.http.delete<HapInstanceDeletingResult>(`${this.api}/instances/${instance.id}`, { headers: this.application.httpHeaders() });
  }

  activateInstances(instancList: string[]) {
    return this.http.patch<HapInstanceSavingResult>(`${this.api}/activate`, instancList, { headers: this.application.httpHeaders() });
  }
}
