import { Component, OnInit } from '@angular/core';
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

  constructor(
    public store: Store<Models.AppState>,
    private logger: NGXLogger,) {
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
  }

  saveSettings(): void {
    this.store.dispatch(Actions.SaveSystemConfigAction({ systemconfig: this.configData }));
  }

}
