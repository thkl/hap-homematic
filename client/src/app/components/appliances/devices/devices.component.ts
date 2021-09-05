import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store'
import { AbstractTableComponent } from '../../abstracttable/abstracttable';


@Component({
  selector: 'app-deviceslist',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.sass'],
})
export class DeviceListComponent extends AbstractTableComponent {

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'serial',
      'name',
      'serviceClass',
      'instanceID',
      'control',
    ];

    this.dataSourceSelector = Selectors.selectAllAppliances(false);
    this.loadingSelector = Selectors.appliancesLoading;
    this.searchFields = ['serial', 'name'];
  }
}
