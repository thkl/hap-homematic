
import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { HapDevicesService } from 'src/app/service/hapdevices.service';
import { Actions, Models } from 'src/app/store';

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

  @Input() save = new EventEmitter();

  serviceList: Observable<Models.HapApplianceService[]>;
  selectedServiceClass: Models.HapApplianceService;

  constructor(
    private deviceService: HapDevicesService,
    public store: Store<Models.AppState>
  ) { }


  ngOnDestroy(): void {
    // save on exit
    if (this.selectedAppliance) {
      this.store.dispatch({ type: Actions.HapDeviceActionTypes.SAVE_DEVICE, payload: this._selectedAppliance });
    }
  }

  ngOnInit(): void {

  }

  loadServices() {
    if (this.selectedAppliance !== undefined) {
      this.deviceService.loadServiceData(this.selectedAppliance.address).subscribe(serviceResponse => {
        this.serviceList = of(serviceResponse.service);

        if (this.selectedAppliance.serviceClass) {
          this.selectedServiceClass = serviceResponse.service.filter(sc => sc.serviceClazz === this.selectedAppliance.serviceClass)[0];
        } else {
          this.selectedServiceClass = serviceResponse.service.filter(sc => sc.priority === 0)[0];
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
  }
}
