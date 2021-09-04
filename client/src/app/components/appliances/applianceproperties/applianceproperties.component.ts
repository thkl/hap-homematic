
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HapDevicesService } from 'src/app/service/hapdevices.service';
import { HapAppliance, HapApplianceService } from 'src/app/store/models';

@Component({
  selector: 'app-applianceproperties',
  templateUrl: './applianceproperties.component.html',
  styleUrls: ['./applianceproperties.component.sass']
})
export class AppliancePropertiesComponent implements OnInit {

  private _selectedAppliance: HapAppliance;

  @Input() set selectedAppliance(newAppliance: HapAppliance) {
    this._selectedAppliance = newAppliance;
    this.loadServices();
  }

  get selectedAppliance(): HapAppliance {
    return this._selectedAppliance;
  }

  serviceList: Observable<HapApplianceService[]>;

  constructor(
    private deviceService: HapDevicesService,
  ) { }

  ngOnInit(): void {

  }

  loadServices() {
    console.log('selectedAppliance %s', this.selectedAppliance)
    if (this.selectedAppliance !== undefined) {
      const channelAddress = `${this.selectedAppliance.serial}:${this.selectedAppliance.channel}`;
      this.deviceService.loadServiceData(channelAddress).subscribe(serviceResponse => {
        this.serviceList = of(serviceResponse.service);
      })
    }
  }

  selectClazz(newClazz: any) {
    console.log(newClazz);
  }
}
