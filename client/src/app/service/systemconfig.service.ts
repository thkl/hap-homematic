import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SystemConfig } from '../store/models/SystemConfig.model';
import { ApplicationService } from './application.service';

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
}
