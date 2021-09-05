import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-header-appliancelist',
  templateUrl: './header_appliancelist.component.html',
  styleUrls: ['./header_appliancelist.component.sass'],
})
export class AppliancelistHeaderComponent implements OnInit {
  public hapProgramCount: number;
  public hapDeviceCount: number;
  public hapVariableCount: number;
  public hapSpecialDeviceCount: number;

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectAppliancesCount(false))).subscribe((devcount) => {
      this.hapDeviceCount = devcount;
    });
    this.store.pipe(select(Selectors.selectProgramCount)).subscribe((prgcount) => {
      this.hapProgramCount = prgcount;
    });

    this.store.pipe(select(Selectors.selectVariableCount)).subscribe((varcount) => {
      this.hapVariableCount = varcount;
    });

    this.store.pipe(select(Selectors.selectSpecialDeviceCount)).subscribe((spdcount) => {
      this.hapSpecialDeviceCount = spdcount;
    });

  }
}
