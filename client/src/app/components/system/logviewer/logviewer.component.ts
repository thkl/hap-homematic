import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { NGXLogger, NgxLoggerLevel } from 'ngx-logger';
import { ApplicationService } from 'src/app/service/application.service';
import { Actions, Models, Selectors } from 'src/app/store'

@Component({
  selector: 'app-logviewer',
  templateUrl: './logviewer.component.html',
  styleUrls: ['./logviewer.component.sass']
})
export class LogViewerComponent implements OnInit {

  logContent: any;
  isDebugging: boolean;

  constructor(
    public store: Store<Models.AppState>,
    private applicationService: ApplicationService,
    private logger: NGXLogger
  ) {

  }

  ngOnInit(): void {
    this.logContent = this.store.pipe(select(Selectors.loggingData))

    this.store.pipe(select(Selectors.configData)).subscribe((newConfig) => {
      this.isDebugging = newConfig.debug;
      if (this.isDebugging) {
        this.logger.updateConfig({ level: NgxLoggerLevel.DEBUG });
        this.logger.debug('LogViewerComponent::Debug enabled')
      } else {
        this.logger.updateConfig({ level: NgxLoggerLevel.INFO });
        this.logger.debug('LogViewerComponent::Debug disabled')
      }
    })
    this.refresh();
  }

  refresh(): void {
    this.logger.debug(`LogViewerComponent::refresh`);
    this.store.dispatch(Actions.LoadSystemLogfileAction());
  }

  toggleDebug(): void {
    this.logger.debug(`LogViewerComponent::toggleDebug`);
    this.store.dispatch(Actions.SwitchDebugAction({ enable: !this.isDebugging }));
  }

  downloadLog(): void {
    this.logger.debug(`LogViewerComponent::downloadLog`);
    window.open(`${this.applicationService.getApiURL()}/log/download`);
  }
}
