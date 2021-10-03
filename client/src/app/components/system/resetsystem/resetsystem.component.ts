import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { takeUntil } from 'rxjs/operators';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models, Selectors } from 'src/app/store';
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
    private configService: SystemconfigService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.logger.debug(`ResetsystemComponent::init`);
    this.addSubscription(
      this.store.pipe(select(Selectors.configLoadingError)).subscribe((error) => {
        console.log(error);
        if (error !== undefined) {
          this.logger.debug(`ResetsystemComponent::still rebooting`);
          setTimeout(() => { this.store.dispatch(Actions.LoadSystemConfigAction()); }, 5000); // Try to reload the config 5seconds from now
        }
      })
    );
  }


  subscribeToConfigReload(): void {
    this.addSubscription(
      this.store.pipe(select(Selectors.configData)).subscribe((cfg) => {
        if (cfg !== undefined) {
          this.logger.debug(`ResetsystemComponent::rebooting completed`);
          this.isRestarting = false;
          this.store.dispatch(Actions.LoadHapInstanceAction());
          this.store.dispatch(Actions.LoadHapAppliancesAction());
          this.router.navigate(['/']);
        }
      })
    );
  }

  proceedReset(): void {
    this.isRestarting = true;
    this.logger.debug(`ResetsystemComponent::proceedReset`);
    this.configService.doReset().subscribe(() => {
      setTimeout(() => {
        this.subscribeToConfigReload();
        this.store.dispatch(Actions.LoadSystemConfigAction());
      }, 30000)
    });
  }
}
