import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { NGXLogger, NgxLoggerLevel } from 'ngx-logger';
import { Actions, Models, Selectors } from 'src/app/store'

@Component({
  selector: 'app-logviewer',
  templateUrl: './logviewer.component.html',
  styleUrls: ['./logviewer.component.sass']
})
export class LogViewerComponent implements OnInit {

  logContent: any
  constructor(
    public store: Store<Models.AppState>,
    private logger: NGXLogger
  ) { }

  ngOnInit(): void {
    this.logContent = this.store.pipe(select(Selectors.loggingData))
    this.refresh();
  }

  refresh(): void {
    this.store.dispatch(Actions.LoadSystemLogfileAction());
  }

  enableDebug(): void {
    /*
        this.configService.toggleDebug(false).subscribe(isEnabled => {
          console.log(isEnabled);
          this.logger.updateConfig({ level: NgxLoggerLevel.DEBUG });
          this.logger.debug('Debug enabled')
        })
        */
  }
}
