import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-header-appliancelist',
  templateUrl: './header_appliancelist.component.html',
  styleUrls: ['./header_appliancelist.component.sass'],
})
export class AppliancelistHeaderComponent implements OnInit, OnDestroy {
  public hapProgramCount: number;
  public hapDeviceCount: number;
  public hapVariableCount: number;
  public hapSpecialDeviceCount: number;
  private ngDestroyed$ = new Subject();

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Device)))
      .pipe(takeUntil(this.ngDestroyed$)).subscribe((devcount) => {
        this.hapDeviceCount = devcount;
      });
    this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Program)))
      .pipe(takeUntil(this.ngDestroyed$)).subscribe((prgcount) => {
        this.hapProgramCount = prgcount;
      });

    this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Variable)))
      .pipe(takeUntil(this.ngDestroyed$)).subscribe((varcount) => {
        this.hapVariableCount = varcount;
      });

    this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Special)))
      .pipe(takeUntil(this.ngDestroyed$)).subscribe((spdcount) => {
        this.hapSpecialDeviceCount = spdcount;
      });

  }

  ngOnDestroy() {
    this.ngDestroyed$.next();
  }

}
