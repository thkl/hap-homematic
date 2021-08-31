import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { LocalizationService } from './service/localization.service';
import { Actions, Selectors } from './store';
import { AppState } from './store/models/app-state.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit {
  title = 'HAP-Homematic';
  public todayDate: Date = new Date();
  public phraseLoaded: boolean;
  constructor(
    private store: Store<AppState>,
    private localizationService: LocalizationService
  ) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.localizationLoaded)).subscribe((phl) => {
      this.phraseLoaded = phl;
    })
    this.store.dispatch({ type: Actions.LocalizationActionTypes.LOAD });
  }
}
