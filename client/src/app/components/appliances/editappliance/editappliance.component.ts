import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';


@Component({
  selector: 'app-editappliance',
  templateUrl: './editappliance.component.html',
  styleUrls: ['./editappliance.component.sass']
})
export class EditApplianceComponent implements OnInit, OnDestroy {

  selectedAppliance: HapAppliance;
  saveApplianceState: boolean = false;

  constructor(private route: ActivatedRoute, public store: Store<Models.AppState>) { }

  ngOnInit(): void {



    this.route.params.subscribe(params => {
      const address = params['address'];
      // copy the appliance to the tmp store
      this.store.dispatch({ type: Actions.HapApplianceActionTypes.EDIT_APPLIANCE, payload: address });

      this.store.pipe(select(Selectors.selectTemporaryApplianceByAddress(address))).subscribe(appliance => {
        if (appliance !== undefined) {
          this.selectedAppliance = appliance;
        }
      })

    })
  }

  ngOnDestroy(): void {
    this.store.dispatch({ type: Actions.HapApplianceActionTypes.CLEAN_APPLIANCE_STORE });
  }


  doSaveAppliance() {
    this.saveApplianceState = true;
  }

}
