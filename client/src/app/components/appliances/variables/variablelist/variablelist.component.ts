import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AbstractTableComponent } from 'src/app/components/abstracttable/abstracttable';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-variablelist',
  templateUrl: './variablelist.component.html',
  styleUrls: ['./variablelist.component.sass'],
})
export class VariablelistComponent extends AbstractTableComponent {

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'nameInCCU',
      'name',
      'serviceClass',
      'instanceID',
      'control',
    ];

    this.dataSourceSelector = Selectors.selectAllAppliances(Models.HapApplicanceType.Variable);
    this.loadingSelector = Selectors.appliancesLoading;
    this.searchFields = ['nameInCCU', 'name'];
  }
}
