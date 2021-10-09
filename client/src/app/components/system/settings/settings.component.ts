import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { Actions, Models, Selectors } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent extends AbstractDataComponent implements OnInit {

  configData: Models.SystemConfig;
  isRestarting = false;

  constructor(
    public store: Store<Models.AppState>,
    private logger: NGXLogger,
    private router: Router
  ) {
    super()
  }

  ngOnInit(): void {
    this.addSubscription(
      this.store.pipe(select(Selectors.configData)).subscribe(configData => {
        if (configData !== undefined) {
          this.configData = Object.assign({}, configData);
          this.unsubscribeAll(); // We do want this just once
        }
      })
    )

    this.addSubscription(
      this.store.pipe(select(Selectors.configLoadingError))
        .subscribe((error) => {
          console.log(error);
          if (error !== undefined) {
            this.logger.debug(`RestartComponent::still rebooting`);
            setTimeout(() => { this.reloadConfig() }, 5000); // Try to reload the config 5seconds from now
          }
        })
    );

    this.addSubscription(
      this.store.pipe(select(Selectors.configIsLoading))
        .subscribe((isLoading) => {
          if ((isLoading === false) && (this.isRestarting === true)) {
            this.logger.debug(`RestartComponent::rebooting completed`);
            this.isRestarting = false;
            this.router.navigate(['/']);
          }
        })
    );
  }

  reloadConfig(): void {
    this.isRestarting = true;
    this.store.dispatch(Actions.LoadSystemConfigAction());
  }

  saveSettings(): void {
    this.store.dispatch(Actions.SaveSystemConfigAction({ systemconfig: this.configData }));
  }

}
