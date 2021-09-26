
import { Component, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { Observable, of } from 'rxjs';
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
  public isDirty = true;

  @Input() set selectedAppliance(newAppliance: Models.HapAppliance) {
    if (newAppliance !== undefined) {
      // not my proudest solution to make rw copy
      this._selectedAppliance = JSON.parse(JSON.stringify(newAppliance));
      if (this._selectedAppliance.settings === undefined) {
        this._selectedAppliance.settings = {};
      }
      // Copy the settings to a local variable for easier access
      this.currentSettings = this._selectedAppliance.settings.settings;
      this.loadServices();
    }
  }

  get selectedAppliance(): Models.HapAppliance {
    return this._selectedAppliance;
  }

  serviceList: Observable<Models.HapApplianceService[]>;
  selectedServiceClass: Models.HapApplianceService;
  instanceList: Observable<Models.HapInstance[]>;
  currentSettings: { [key: string]: any }; // this is a copy for easier access in the template
  dpselectorFilterChannels: string[];

  constructor(
    private apiService: HapApplianceApiService,
    public store: Store<Models.AppState>,
    private applicationService: ApplicationService,
    private logger: NGXLogger
  ) { }

  ngOnDestroy(): void {
    // save on exit
    if (this.isDirty === true) {
      this.save();
    }
  }

  loadServices(): void {
    if (this.selectedAppliance !== undefined) {
      this.logger.debug(`Loading Services for ${this.selectedAppliance.applianceType}`);

      this.apiService.loadServiceData(this.selectedAppliance.address, this.selectedAppliance.applianceType).subscribe(serviceResponse => {

        this.logger.debug(`Loading Services done for ${this.selectedAppliance.applianceType}`, serviceResponse.service);
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
            let instanceID = list[0].id;
            // Set the default Instance
            this._selectedAppliance.instanceID = instanceID;

            const channel = this.applicationService.channelWithAddress(this._selectedAppliance.address);
            if (channel !== undefined) {
              const ccuRoom = this.applicationService.roomForChannel(channel);

              if (ccuRoom) {
                const roomifiedInstance = list.filter(instance => instance.roomId === ccuRoom.id)[0];
                if (roomifiedInstance) {
                  instanceID = roomifiedInstance.id
                }
              }

            }
            if (this._selectedAppliance.instances.length === 0) {
              this._selectedAppliance.instances.push({ id: instanceID, name: '', remove: false })
            }
          }
        }
      })
    }
  }

  saveSetting(propKey: any, newSetting: any): void {
    this.logger.debug(`Saving settings ${propKey}`, newSetting);
    if (this._selectedAppliance.settings.settings === undefined) {
      this._selectedAppliance.settings.settings = {};
    }
    this._selectedAppliance.settings.settings[propKey] = newSetting;
    // Copy the settings again to the local variable
    this.currentSettings = this._selectedAppliance.settings.settings;
    this.isDirty = true;
  }

  selectClazz(newClazz: any): void {
    this.logger.debug(`New serviceclass selected for ${this.selectedAppliance.address}`, newClazz);
    this.selectedServiceClass = newClazz;
    this.selectedAppliance.serviceClass = newClazz.serviceClazz;
    this.isDirty = true;
  }

  selectInstance(index: number, newInstance: HapInstance): void {
    this.selectedAppliance.instances[index] = { id: newInstance.id };
    this.updateInstanceList();
    this.isDirty = true;
  }

  cleanUp(): void {
    // Cleanup the settings
    const settings = this._selectedAppliance.settings;
    // remove empty items in text_control_array - this is a mess ...
    console.log(settings);
    const serviceClassSettings = this.selectedServiceClass.settings
    Object.keys(serviceClassSettings).forEach(settingsKey => {
      const setTemplate = serviceClassSettings[settingsKey];
      if (setTemplate.type === 'text_control_array') {
        const aSetting = settings.settings[settingsKey];
        Object.keys(aSetting).forEach(objKey => {
          if (aSetting[objKey] === '') {
            delete aSetting[objKey];
          }
        })
      }
    })
  }

  validate(): boolean {

    this.validationResult = this.applianceValidator.validate(this.selectedAppliance,
      this.selectedServiceClass);

    this.logger.debug(`Settings validation is done ${this.validationResult.isValid}`, [this.validationResult, this.selectedAppliance, this.selectedServiceClass]);

    return this.validationResult.isValid;
  }

  getValidatenResult(): ValidationResult {
    return this.validationResult;
  }

  save(): void {
    if (this.selectedAppliance) {
      // Update InstanceList in settings
      this.logger.debug(`Save appliance to api`, this._selectedAppliance);
      this._selectedAppliance.settings.instance = this._selectedAppliance.instances; //
      this.cleanUp();
      this.store.dispatch(Actions.SaveHapApplianceAction({ applianceToSave: this._selectedAppliance }));
      this.isDirty = false;
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
      if (instData !== undefined) {
        inst.name = instData.displayName;
        idx = idx + 1;
      } else {
        this.logger.error(`AppliancePropertiesComponent::updateInstanceList Instance with ID ${inst.id} not found`);
      }
    });
  }

  addNewInstance(): void {
    this.selectedAppliance.instances.push({ id: 0 })
    this.updateInstanceList();
    this.isDirty = true;
  }

  removeInstance(index: number, instId: any): void {
    const idxInstance = this.selectedAppliance.instances[index]
    if ((idxInstance) && (idxInstance.id === instId)) {
      this.selectedAppliance.instances.splice(index, 1);
    }
    this.isDirty = true;
  }
}
