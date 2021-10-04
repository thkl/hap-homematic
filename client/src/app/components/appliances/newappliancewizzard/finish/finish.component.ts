import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { AbstractDataComponent } from 'src/app/components/abstractdatacomponent/abstractdatacomponent.component';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-newappliancewizzard-finish',
  templateUrl: './finish.component.html',
  styleUrls: ['./finish.component.sass']
})
export class NewApplianceWizzardFinishComponent extends AbstractDataComponent implements OnInit {

  public list: HapAppliance[];
  public saving = false;
  private ngDestroyed$ = new Subject();

  constructor(public store: Store<Models.AppState>) {
    super()
  }

  ngOnInit(): void {
    this.addSubscription(
      this.store.pipe(select(Selectors.selectAllTemporaryAppliances(Models.HapApplicanceType.All)))
        .subscribe(applList => {
          if (applList !== undefined) {
            this.list = applList.filter(app => ((app !== null) && (app !== undefined)));
            if (!this.saving) {
              this.saving = true;
              setTimeout(() => { this.store.dispatch({ type: Actions.HapApplianceActionTypes.SAVE_APPLIANCE_TO_API, payload: this.list }); }, 500);
            }
          }
        })
    );
  }
}
