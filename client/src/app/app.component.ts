import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { LocalizationService } from './service/localization.service';
import {
  LoadSystemConfigAction,
  SystemConfigActionTypes,
} from './store/actions/SystemConfig.action';
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
  ) {}

  ngOnInit(): void {
    // Wait loading the menubar and breadcrumbs until the localizer is done
    this.localizationService.subscribeToPhraseLoadStatus().subscribe(() => {
      this.phraseLoaded = true;
    });
  }
}
