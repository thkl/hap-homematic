import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { environment } from 'src/environments/environment';
import { Actions, Models } from '../store';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public api: string = environment.api;
  public language: string = 'de';

  constructor(private store: Store<Models.AppState>) {
    console.log('Booting');
  }
}
