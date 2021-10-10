import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { Subject } from 'rxjs';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance, HapApplicanceType } from 'src/app/store/models';
import { ValidationResult } from 'src/app/validators/validationResult';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';
import { AppliancePropertiesComponent } from '../applianceproperties/applianceproperties.component';


@Component({
  selector: 'app-editappliance',
  templateUrl: './editappliance.component.html',
  styleUrls: ['./editappliance.component.sass']
})
export class EditApplianceComponent extends AbstractDataComponent implements OnInit, OnDestroy {

  selectedAppliance: HapAppliance;
  saveApplianceState = false;
  title = 'Edit';
  saving = false;
  validationResult: ValidationResult;

  @ViewChild(AppliancePropertiesComponent) properties: AppliancePropertiesComponent;

  constructor(
    private route: ActivatedRoute,
    public store: Store<Models.AppState>,
    private router: Router,
    private logger: NGXLogger
  ) {
    super()
  }

  ngOnInit(): void {
    this.logger.debug(`EditApplianceComponent::ngOnInit`);
    this.route.params.subscribe(params => {
      const address = params['address'];
      this.logger.debug(`EditApplianceComponent::using address ${address}`);
      // copy the appliance to the tmp store
      this.store.dispatch({ type: Actions.HapApplianceActionTypes.EDIT_APPLIANCE, payload: address });
      this.addSubscription(
        this.store.pipe(select(Selectors.selectTemporaryApplianceByAddress(address))).subscribe(appliance => {
          if (appliance !== undefined) {
            this.logger.debug(`EditApplianceComponent::appliance found `, [appliance]);
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
      )
    })
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.logger.debug(`EditApplianceComponent::ngOnDestroy`);
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
      case HapApplicanceType.Special:
        this.router.navigate(['/special']);
        break;
    }
  }

  doSaveAppliance(): void {
    this.logger.debug(`EditApplianceComponent::doSaveAppliance`);
    if (this.properties.validate()) {
      this.saveApplianceState = true;
      this.addSubscription(
        this.store.pipe(select(Selectors.appliancesSaving)).subscribe(isSaving => {
          if ((this.saving === true) && (isSaving === false)) {
            this.goBack();
          } else {
            this.saving = isSaving;
          }
        })
      )
    } else {
      this.validationResult = this.properties.getValidatenResult();
      this.logger.debug(`EditApplianceComponent::validation failed ${this.validationResult}`);
    }
  }

}
