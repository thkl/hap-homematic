import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-crashlogs',
  templateUrl: './crashlogs.component.html',
  styleUrls: ['./crashlogs.component.sass']
})
export class CrashlogsComponent implements OnInit {

  crashList: Observable<string[]>;
  currentCrash: Observable<string>;

  constructor(
    public store: Store<Models.AppState>,
    private logger: NGXLogger
  ) { }

  ngOnInit(): void {
    this.crashList = this.store.pipe(select(Selectors.crashList));
    this.currentCrash = this.store.pipe(select(Selectors.crashDetail));
    this.refresh()
  }

  refresh(): void {
    this.logger.debug('CrashlogsComponent::refreshing crashlist');
    this.store.dispatch(Actions.LoadCrashlistAction());
  }

  deleteCrash(ts: string): void {
    this.logger.debug(`CrashlogsComponent::deleteCrash (${ts})`);
    this.store.dispatch(Actions.DeleteCrashDetailAction({ timestamp: ts }));
  }

  selectTimestamp(ts: string): void {
    this.logger.debug(`CrashlogsComponent::selectTimestamp (${ts})`);
    this.store.dispatch(Actions.LoadCrashDetailAction({ timestamp: ts }));
  }
}
