import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HapAppliance } from '../store/models/HapAppliance.model';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root',
})
export class HapSpecialDevicesService {
  api: string;

  constructor(
    private http: HttpClient,
    private application: ApplicationService
  ) {
    this.api = application.api;
  }

  loadHapSpecialDevices() {
    return this.http.get<HapAppliance[]>(`${this.api}/special`);
  }
}
