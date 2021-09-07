import { AfterViewInit, Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-newappliancewizzard-finish',
  templateUrl: './finish.component.html',
  styleUrls: ['./finish.component.sass']
})
export class NewApplianceWizzardFinishComponent implements OnInit, AfterViewInit {

  public list: HapAppliance[];
  public saving = false;

  constructor(public store: Store<Models.AppState>) { }

  ngAfterViewInit(): void {

  }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectAllTemporaryAppliances(Models.HapApplicanceType.All))).subscribe(applList => {
      if (applList !== undefined) {
        this.list = applList;
        if (!this.saving) {
          this.saving = true;
          console.log('saving to api')
          setTimeout(() => { this.store.dispatch({ type: Actions.HapApplianceActionTypes.SAVE_APPLIANCE_TO_API, payload: this.list }); }, 500);
          //
        }
      }
    });
  }

}
