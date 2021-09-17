import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, Models, Selectors } from 'src/app/store'
import { HapAppliance } from 'src/app/store/models';
import { AbstractTableComponent } from '../../abstracttable/abstracttable';


@Component({
  selector: 'app-deviceslist',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.sass'],
})
export class DeviceListComponent extends AbstractTableComponent {
  confirmId = 'deleteDevice';

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'address',
      'name',
      'serviceClass',
      'instanceID',
      'control',
    ];

    this.dataSourceSelector = Selectors.selectAllAppliances(Models.HapApplicanceType.Device);
    this.loadingSelector = Selectors.appliancesLoading;
    this.searchFields = ['address', 'name'];
  }


  deleteDevice(applianceToDelete: HapAppliance) {
    this.store.dispatch(Actions.DeleteHapApplianceFromApiAction({ applianceToDelete }));
  }
}
