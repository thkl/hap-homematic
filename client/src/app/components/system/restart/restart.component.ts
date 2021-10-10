import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { ApplicationService } from 'src/app/service/application.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models, Selectors } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';

@Component({
  selector: 'app-restart',
  templateUrl: './restart.component.html',
  styleUrls: ['./restart.component.sass']
})
export class RestartComponent extends AbstractDataComponent implements OnInit {

  isRestarting = false;
  enableDebug: boolean;

  constructor(
    private applicationService: ApplicationService,
    public store: Store<Models.AppState>,
    private configService: SystemconfigService,
    private logger: NGXLogger,
    private router: Router
  ) {
    super();
  }


  ngOnInit(): void {
    // Subscribe to the global Restart Indicator
    this.addSubscription(this.applicationService.restartIndicator().subscribe(() => {
      this.isRestarting = false;
      this.store.dispatch(Actions.LoadSystemConfigAction());
      this.router.navigate(['/']);
    }));
  }


  downloadLog(): void {
    this.logger.debug(`RestartComponent::downloadLog`);
    window.open(`${this.applicationService.getApiURL()}/log/download`);
  }

  doReboot(): void {
    this.logger.debug(`RestartComponent::doReboot`);
    this.configService.doReboot(this.enableDebug).subscribe(() => {
      this.logger.debug(`RestartComponent::doReboot initiated`);
      this.isRestarting = true;
    })
  }
}
