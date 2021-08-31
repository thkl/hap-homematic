import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HapAppliance } from '../store/models/HapAppliance.model';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root',
})
export class HapProgramsService {
  api: string;

  constructor(
    private http: HttpClient,
    private application: ApplicationService
  ) {
    this.api = application.api;
  }

  loadHapPrograms() {
    return this.http.get<HapAppliance[]>(`${this.api}/programs`);
  }
}
