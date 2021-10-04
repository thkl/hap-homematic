import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApplicationService } from 'src/app/service/application.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { ChangeLog } from 'src/app/store/models';

@Component({
  selector: 'app-changelog',
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.sass']
})
export class ChangelogComponent implements OnInit {

  changeLog: ChangeLog;
  currentVersion: string;

  constructor(
    private systemConfigService: SystemconfigService,
    private applicationService: ApplicationService
  ) { }

  ngOnInit(): void {
    this.currentVersion = this.applicationService.getSystemState().version;
    this.systemConfigService.getChangeLog().subscribe((changelog) => {
      this.changeLog = changelog;
    })
  }


  keyDescOrder = (a: KeyValue<any, any>, b: KeyValue<any, any>): number => {
    return a.key > b.key ? -1 : (b.key > a.key ? 1 : 0);
  }

}
