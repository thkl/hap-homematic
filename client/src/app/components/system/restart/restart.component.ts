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


  downloadLog(): void {
    this.logger.debug(`RestartComponent::downloadLog`);
    window.open(`${this.applicationService.getApiURL()}/log/download`);
  }

  reloadConfig(): void {
    this.store.dispatch(Actions.LoadSystemConfigAction());
  }

  doReboot(): void {

    this.logger.debug(`RestartComponent::doReboot`);
    this.configService.doReboot(this.enableDebug).subscribe(() => {
      this.logger.debug(`RestartComponent::doReboot initiated`);
      this.isRestarting = true;
      setTimeout(() => {
        this.reloadConfig();
      }, 30000);
    })

  }





}
