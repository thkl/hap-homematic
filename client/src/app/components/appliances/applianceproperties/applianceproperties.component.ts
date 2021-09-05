
import { Component, EventEmitter, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { HapDevicesService } from 'src/app/service/hapdevices.service';
import { Actions, Models } from 'src/app/store';
import { HapAppliance, HapApplianceService } from 'src/app/store/models';

@Component({
  selector: 'app-applianceproperties',
  templateUrl: './applianceproperties.component.html',
  styleUrls: ['./applianceproperties.component.sass']
})
export class AppliancePropertiesComponent implements OnInit {

  private _selectedAppliance: HapAppliance;

  @Input() set selectedAppliance(newAppliance: HapAppliance) {
    if (newAppliance !== undefined) {
      // not my proudest solution to make rw copy
      this._selectedAppliance = JSON.parse(JSON.stringify(newAppliance));
      if (this._selectedAppliance.settings === undefined) {
        this._selectedAppliance.settings = {};
      }
      this.loadServices();
    }
  }

  get selectedAppliance(): HapAppliance {
    return this._selectedAppliance;
  }

  @Input() save = new EventEmitter();


  serviceList: Observable<HapApplianceService[]>;

  selectedServiceClass: HapApplianceService;

  constructor(
    private deviceService: HapDevicesService,
    public store: Store<Models.AppState>
  ) { }

  ngOnInit(): void {
    this.save.subscribe(() => {
      this.store.dispatch({ type: Actions.HapDeviceActionTypes.SAVE_DEVICE, payload: this._selectedAppliance });
    })
  }

  loadServices() {
    if (this.selectedAppliance !== undefined) {
      const applianceAddress = `${this.selectedAppliance.serial}:${this.selectedAppliance.channel}`;
      this.deviceService.loadServiceData(applianceAddress).subscribe(serviceResponse => {
        this.serviceList = of(serviceResponse.service);
      })
    }
  }

  getSettings(propKey: any, defaultData: any): any {
    let settings = this._selectedAppliance.settings;
    if (settings !== undefined) {
      return settings[propKey] || defaultData;
    } else {
      return defaultData;
    }
  }

  saveSetting(propKey: any, newSetting: any): void {
    this._selectedAppliance.settings[propKey] = newSetting;
  }

  selectClazz(newClazz: any) {
    this.selectedServiceClass = newClazz;
  }
}
