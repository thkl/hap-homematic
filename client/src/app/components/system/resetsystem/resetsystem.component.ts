import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-resetsystem',
  templateUrl: './resetsystem.component.html',
  styleUrls: ['./resetsystem.component.sass']
})
export class ResetsystemComponent implements OnInit {

  doReset: boolean
  isRestarting: boolean;

  constructor(
    private router: Router,
    public store: Store<Models.AppState>,
    private logger: NGXLogger,
    private configService: SystemconfigService,
  ) { }

  ngOnInit(): void {
    this.logger.debug(`ResetsystemComponent::init`);
    this.store.pipe(select(Selectors.configLoadingError)).subscribe((error) => {
      console.log(error);
      if (error !== undefined) {
        this.logger.debug(`ResetsystemComponent::still rebooting`);
        setTimeout(() => { this.reloadConfig() }, 5000); // Try to reload the config 5seconds from now
      }
    });
  }

  reloadConfig(): void {
    this.store.dispatch(Actions.LoadSystemConfigAction());
    this.store.pipe(select(Selectors.configData)).subscribe((cfg) => {
      if (cfg !== undefined) {
        this.logger.debug(`ResetsystemComponent::rebooting completed`);
        this.isRestarting = false;
        this.store.dispatch(Actions.LoadHapInstanceAction());
        this.store.dispatch(Actions.LoadHapAppliancesAction());
        this.router.navigate(['/']);
      }
    })
  }

  proceedReset(): void {
    this.isRestarting = true;
    this.logger.debug(`ResetsystemComponent::proceedReset`);
    this.configService.doReset().subscribe(() => {
      setTimeout(() => {
        this.reloadConfig();
      }, 30000)
    });
  }
}
