import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AbstractTableComponent } from 'src/app/components/abstracttable/abstracttable';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-speciallist',
  templateUrl: './speciallist.component.html',
  styleUrls: ['./speciallist.component.sass']
})
export class SpeciallistComponent extends AbstractTableComponent {

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'name',
      'serviceClass',
      'instanceID',
      'control',
    ];

    this.dataSourceSelector = Selectors.selectAllSpecialDevices;
    this.loadingSelector = Selectors.specialDeviceLoading;
  }


}
