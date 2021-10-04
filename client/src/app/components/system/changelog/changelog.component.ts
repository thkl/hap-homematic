import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApplicationService } from 'src/app/service/application.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { ChangeLog } from 'src/app/store/models';
import *  as Utility from 'src/app/service/utility';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';
import { Models, Selectors } from 'src/app/store';
import { select, Store } from '@ngrx/store';

@Component({
  selector: 'app-changelog',
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.sass']
})
export class ChangelogComponent extends AbstractDataComponent implements OnInit {

  changeLog: ChangeLog;
  currentVersion: string;

  constructor(
    private systemConfigService: SystemconfigService,
    private store: Store<Models.AppState>,
    private applicationService: ApplicationService
  ) {
    super();
  }

  ngOnInit(): void {

    this.addSubscription(
      this.store.pipe(select(Selectors.configData))
        .subscribe((newConfig) => {
          if (newConfig) {
            this.currentVersion = newConfig.version;
          }
        })
    );

    this.systemConfigService.getChangeLog().subscribe((changelog) => {
      this.changeLog = changelog;
    })
  }


  keyDescOrder(a: KeyValue<any, any>, b: KeyValue<any, any>): number {
    return a.key > b.key ? -1 : (b.key > a.key ? 1 : 0);
  }


  isNewerVersion(oldVer: string, newVer: string): boolean {
    return Utility.isNewerVersion(oldVer, newVer);
  }

  doUpdate(): void {

  }
}
