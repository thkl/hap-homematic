import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { ApplicationService } from 'src/app/service/application.service';
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
    private router: Router,
    private applicationService: ApplicationService
  ) {
    super()
  }

  ngOnInit(): void {
    this.addSubscription(
      this.store.pipe(select(Selectors.configData)).subscribe(configData => {
        if (configData !== undefined) {
          if (this.configData === undefined) { // We do want this just once cause every heartbeat sends new config data
            this.configData = Object.assign({}, configData);
          }
        }
      })
    );

    this.addSubscription(this.applicationService.restartIndicator().subscribe(() => {
      this.logger.debug(`SettingsComponent::system was rebootet going back`);
      this.isRestarting = false;
      this.store.dispatch(Actions.LoadSystemConfigAction());
      this.router.navigate(['/']);
    }));
  }

  saveSettings(): void {
    this.logger.debug(`SettingsComponent::save settings`);
    this.store.dispatch(Actions.SaveSystemConfigAction({ systemconfig: this.configData }));
    this.isRestarting = true;


  }

}
