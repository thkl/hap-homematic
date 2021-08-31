import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public api: string = 'http://localhost:9874/api';

  constructor() { }
}
