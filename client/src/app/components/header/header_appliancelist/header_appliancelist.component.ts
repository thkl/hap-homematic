import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';

@Component({
  selector: 'app-header-appliancelist',
  templateUrl: './header_appliancelist.component.html',
  styleUrls: ['./header_appliancelist.component.sass'],
})
export class AppliancelistHeaderComponent extends AbstractDataComponent implements OnInit {
  public hapProgramCount: number;
  public hapDeviceCount: number;
  public hapVariableCount: number;
  public hapSpecialDeviceCount: number;

  constructor(private store: Store<Models.AppState>) {
    super()
  }

  ngOnInit(): void {
    this.addSubscription(
      this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Device)))
        .subscribe((devcount) => {
          this.hapDeviceCount = devcount;
        })
    );
    this.addSubscription(
      this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Program)))
        .subscribe((prgcount) => {
          this.hapProgramCount = prgcount;
        })
    );

    this.addSubscription(
      this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Variable)))
        .subscribe((varcount) => {
          this.hapVariableCount = varcount;
        })
    );

    this.addSubscription(
      this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.Special)))
        .subscribe((spdcount) => {
          this.hapSpecialDeviceCount = spdcount;
        })
    );

  }

}
