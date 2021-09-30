import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { LocalizationService } from './service/localization.service';
import { Actions, Selectors } from './store';
import { AppState } from './store/models/app-state.model';
import { NGXLogger } from "ngx-logger";
import { ConsoleLoggerMonitor } from './service/logger.service';
import { ApplicationService } from './service/application.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit {
  title = 'HAP-Homematic';
  public isLoading: boolean;
  errorMessage: string = undefined;

  public todayDate: Date = new Date();
  public phraseLoaded: boolean;
  constructor(
    private store: Store<AppState>,
    private localizationService: LocalizationService,
    private applicationService: ApplicationService,
    private logger: NGXLogger,
    private router: Router
  ) {
    this.store.pipe(select(Selectors.localizationLoadingError)).subscribe(error => {
      this.errorMessage = ((error !== undefined) ? error.message : undefined);
      this.logger.debug(`AppComponent::API Error: ${this.errorMessage}`);
    })
  }

  ngOnInit(): void {

    this.logger.registerMonitor(new ConsoleLoggerMonitor());
    this.logger.debug('AppComponent::Booting');
    this.store.pipe(select(Selectors.localizationLoaded)).subscribe((phl) => {
      this.logger.debug(`AppComponent::Localization Phrases loaded (${phl})`)
      this.phraseLoaded = phl;
    })

    this.logger.debug('AppComponent::Loading localization')
    this.store.dispatch({ type: Actions.LocalizationActionTypes.LOAD });

    this.applicationService.globalLoadingIndicator.subscribe(isLoadingArray => {
      setTimeout(() => {
        this.isLoading = isLoadingArray.some(element => element === true);
      }, 10)
    })

    this.store.pipe(select(Selectors.configData)).subscribe(cfg => {
      if ((cfg) && (cfg.isEmpty === true)) {
        this.router.navigate(['/welcome']);
      }
    })
  }


}
