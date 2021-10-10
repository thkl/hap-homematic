import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { ApplicationService } from 'src/app/service/application.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';

@Component({
  selector: 'app-resetsystem',
  templateUrl: './resetsystem.component.html',
  styleUrls: ['./resetsystem.component.sass']
})
export class ResetsystemComponent extends AbstractDataComponent implements OnInit {

  doReset: boolean
  isRestarting: boolean;

  constructor(
    private router: Router,
    public store: Store<Models.AppState>,
    private logger: NGXLogger,
    private applicationService: ApplicationService,
    private configService: SystemconfigService
  ) {
    super();
  }

  ngOnInit(): void {
    this.logger.debug(`ResetsystemComponent::init`);

    this.addSubscription(this.applicationService.restartIndicator().subscribe(() => {
      this.logger.debug(`ResetsystemComponent::rebooting completed`);
      this.isRestarting = false;
      this.store.dispatch(Actions.LoadSystemConfigAction());
      this.store.dispatch(Actions.LoadHapInstanceAction());
      this.store.dispatch(Actions.LoadHapAppliancesAction());
      this.router.navigate(['/']);
    }));
  }

  proceedReset(): void {
    this.isRestarting = true;
    this.logger.debug(`ResetsystemComponent::proceedReset`);
    this.configService.doReset().subscribe(() => {
      this.isRestarting = true;
    });
  }
}
