
import { Component, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ApplicationService } from 'src/app/service/application.service';
import { HapApplianceApiService } from 'src/app/service/hapappliance.service';
import { Actions, Models, Selectors, SelectUtility } from 'src/app/store';
import { HapInstance } from 'src/app/store/models';
import { ApplianceValidator } from 'src/app/validators/appliancesettings.validator';
import { ValidationResult } from 'src/app/validators/validationResult';



@Component({
  selector: 'app-applianceproperties',
  templateUrl: './applianceproperties.component.html',
  styleUrls: ['./applianceproperties.component.sass']
})
export class AppliancePropertiesComponent implements OnDestroy {

  private _selectedAppliance: Models.HapAppliance;
  private validationResult: ValidationResult;
  public applianceValidator = new ApplianceValidator();

  @Input() set selectedAppliance(newAppliance: Models.HapAppliance) {
    if (newAppliance !== undefined) {
      // not my proudest solution to make rw copy
      this._selectedAppliance = JSON.parse(JSON.stringify(newAppliance));
      if (this._selectedAppliance.settings === undefined) {
        this._selectedAppliance.settings = {};
      }

      this.loadServices();
    }
  }

  get selectedAppliance(): Models.HapAppliance {
    return this._selectedAppliance;
  }

  serviceList: Observable<Models.HapApplianceService[]>;
  selectedServiceClass: Models.HapApplianceService;
  instanceList: Observable<Models.HapInstance[]>;

  constructor(
    private apiService: HapApplianceApiService,
    public store: Store<Models.AppState>,
    private applicationService: ApplicationService
  ) { }

  ngOnDestroy(): void {
    // save on exit
    this.save();
  }

  loadServices(): void {
    if (this.selectedAppliance !== undefined) {
      this.apiService.loadServiceData(this.selectedAppliance.address, this.selectedAppliance.applianceType).subscribe(serviceResponse => {
        this.serviceList = of(serviceResponse.service);

        if (this.selectedAppliance.serviceClass) {
          this.selectedServiceClass = serviceResponse.service.filter(sc => sc.serviceClazz === this.selectedAppliance.serviceClass)[0];
        } else {
          this.selectedServiceClass = serviceResponse.service.filter(sc => sc.priority === 0)[0];
        }
      })

      this.instanceList = this.store.select(Selectors.selectAllInstances)


      this.instanceList.subscribe(list => {
        if (list.length > 0) {
          if (this._selectedAppliance.instanceID === undefined) {
            this._selectedAppliance.instanceID = list[0].id;
            const channel = this.applicationService.channelWithAddress(this._selectedAppliance.address);
            if (channel !== undefined) {
              const ccuRoom = this.applicationService.roomForChannel(channel);
              let instanceID = list[0].id;
              if (ccuRoom) {
                const roomifiedInstance = list.filter(instance => instance.roomId === ccuRoom.id)[0];
                if (roomifiedInstance) {
                  instanceID = roomifiedInstance.id
                }
              }
              if (this._selectedAppliance.instances.length === 0) {
                this._selectedAppliance.instances.push({ id: instanceID, name: '', remove: false })
              }
            }
          }
        }
      })
    }
  }

  getSettings(propKey: any, defaultData: any): any {
    const settings = this._selectedAppliance.settings.settings; // this is a little weird
    if (settings !== undefined) {
      return settings[propKey] || defaultData;
    } else {
      return defaultData;
    }
  }


  getID(propKey: any): string {
    return `service_prop_${propKey}`;
  }

  saveSetting(propKey: any, newSetting: any): void {
    if (this._selectedAppliance.settings.settings === undefined) {
      this._selectedAppliance.settings.settings = {};
    }
    this._selectedAppliance.settings.settings[propKey] = newSetting;
  }

  selectClazz(newClazz: any): void {
    this.selectedServiceClass = newClazz;
    this.selectedAppliance.serviceClass = newClazz.serviceClazz;
  }

  selectInstance(index: number, newInstance: HapInstance): void {
    this.selectedAppliance.instances[index] = { id: newInstance.id };
    this.updateInstanceList();
  }

  validate(): boolean {
    this.validationResult = this.applianceValidator.validate(this.selectedAppliance,
      this.selectedServiceClass);
    return this.validationResult.isValid;
  }

  getValidatenResult(): ValidationResult {
    return this.validationResult;
  }

  save(): void {
    if (this.selectedAppliance) {
      // Update InstanceList in settings
      this._selectedAppliance.settings.instance = this._selectedAppliance.instances; //
      this.store.dispatch(Actions.SaveHapApplianceAction({ applianceToSave: this._selectedAppliance }));
    }
  }

  updateInstanceList(): void {
    let idx = 0;
    this.selectedAppliance.instances.forEach(inst => {
      if (idx === 0) {
        inst.remove = false
        this.selectedAppliance.instanceID = inst.id;
      } else {
        inst.remove = true;
      }
      // Get the HAPInstance Object by Selected ID
      const instData = SelectUtility.getInstance(this.store, Selectors.selectInstancesById(inst.id))
      // save the name
      inst.name = instData.displayName;
      idx = idx + 1;
    });
  }

  addNewInstance(): void {
    this.selectedAppliance.instances.push({ id: 0 })
    this.updateInstanceList();
  }

  removeInstance(index: number, instId: any): void {
    const idxInstance = this.selectedAppliance.instances[index]
    if ((idxInstance) && (idxInstance.id === instId)) {
      this.selectedAppliance.instances.splice(index, 1);
    }
  }
}
