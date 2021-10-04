import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { ChangeLog } from 'src/app/store/models';

@Component({
  selector: 'app-changelog',
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.sass']
})
export class ChangelogComponent implements OnInit {

  changeLog: ChangeLog;

  constructor(
    private systemConfigService: SystemconfigService
  ) { }

  ngOnInit(): void {
    this.systemConfigService.getChangeLog().subscribe((changelog) => {
      this.changeLog = changelog;
    })
  }


  keyDescOrder = (a: KeyValue<any, any>, b: KeyValue<any, any>): number => {
    return a.key > b.key ? -1 : (b.key > a.key ? 1 : 0);
  }

}
