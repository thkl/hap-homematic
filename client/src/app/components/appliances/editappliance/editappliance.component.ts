import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance, HapApplicanceType } from 'src/app/store/models';


@Component({
  selector: 'app-editappliance',
  templateUrl: './editappliance.component.html',
  styleUrls: ['./editappliance.component.sass']
})
export class EditApplianceComponent implements OnInit, OnDestroy {

  selectedAppliance: HapAppliance;
  saveApplianceState: boolean = false;
  title: string = 'Edit';
  saving: boolean = false;

  constructor(
    private route: ActivatedRoute,
    public store: Store<Models.AppState>,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.route.params.subscribe(params => {
      const address = params['address'];
      // copy the appliance to the tmp store
      this.store.dispatch({ type: Actions.HapApplianceActionTypes.EDIT_APPLIANCE, payload: address });

      this.store.pipe(select(Selectors.selectTemporaryApplianceByAddress(address))).subscribe(appliance => {
        if (appliance !== undefined) {
          this.selectedAppliance = appliance;

          switch (this.selectedAppliance.applianceType) {
            case HapApplicanceType.Device:
              this.title = 'Edit device %s';
              break;
            case HapApplicanceType.Variable:
              this.title = 'Edit variable %s';
              break;
          }
        }
      })

    })
  }

  ngOnDestroy(): void {
    this.store.dispatch({ type: Actions.HapApplianceActionTypes.CLEAN_APPLIANCE_STORE });
  }

  goBack(): void {
    switch (this.selectedAppliance.applianceType) {
      case HapApplicanceType.Device:
        this.router.navigate(['/devices']);
        break;
      case HapApplicanceType.Variable:
        this.router.navigate(['/variables']);
        break;
      case HapApplicanceType.Program:
        this.router.navigate(['/programs']);
        break;
    }
  }

  doSaveAppliance() {
    this.saveApplianceState = true;

    this.store.pipe(select(Selectors.appliancesSaving)).subscribe(isSaving => {
      if ((this.saving === true) && (isSaving === false)) {
        this.goBack();
      } else {
        this.saving = isSaving;
      }
    })

  }

}
