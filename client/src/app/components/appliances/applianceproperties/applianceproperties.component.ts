
import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, Subject } from 'rxjs';
import { ApplicationService } from 'src/app/service/application.service';
import { HapApplianceApiService } from 'src/app/service/hapappliance.service';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapInstance } from 'src/app/store/models';

@Component({
  selector: 'app-applianceproperties',
  templateUrl: './applianceproperties.component.html',
  styleUrls: ['./applianceproperties.component.sass']
})
export class AppliancePropertiesComponent implements OnInit, OnDestroy {

  private _selectedAppliance: Models.HapAppliance;

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

  ngOnInit(): void {
  }

  loadServices() {
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
              if (ccuRoom) {
                const roomifiedInstance = list.filter(instance => instance.roomId === ccuRoom.id)[0];
                this._selectedAppliance.instanceID = roomifiedInstance ? roomifiedInstance.id : list[0].id;
              }
            }
          }
        }
      })
    }
  }

  getSettings(propKey: any, defaultData: any): any {
    let settings = this._selectedAppliance.settings.settings; // this is a little weird
    if (settings !== undefined) {
      return settings[propKey] || defaultData;
    } else {
      return defaultData;
    }
  }

  saveSetting(propKey: any, newSetting: any): void {
    if (this._selectedAppliance.settings.settings === undefined) {
      this._selectedAppliance.settings.settings = {};
    }
    this._selectedAppliance.settings.settings[propKey] = newSetting;
  }

  selectClazz(newClazz: any) {
    this.selectedServiceClass = newClazz;
    this.selectedAppliance.serviceClass = newClazz.serviceClazz;
  }

  selectInstance(newInstance: HapInstance) {
    this.selectedAppliance.instanceID = newInstance.id;
  }

  save(): void {
    if (this.selectedAppliance) {
      this.store.dispatch(Actions.SaveHapApplianceAction({ applianceToSave: this._selectedAppliance }));
    }
  }
}
