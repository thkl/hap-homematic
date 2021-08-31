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

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectDeviceCount)).subscribe((devcount) => {
      this.hapDeviceCount = devcount;
    });
    this.store.pipe(select(Selectors.selectProgramCount)).subscribe((prgcount) => {
      this.hapProgramCount = prgcount;
    });

    this.store.pipe(select(Selectors.selectVariableCount)).subscribe((varcount) => {
      this.hapVariableCount = varcount;
    });
  }
}
