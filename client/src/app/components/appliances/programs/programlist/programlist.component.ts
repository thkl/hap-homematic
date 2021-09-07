import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AbstractTableComponent } from 'src/app/components/abstracttable/abstracttable';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-programlist',
  templateUrl: './programlist.component.html',
  styleUrls: ['./programlist.component.sass'],
})
export class ProgramlistComponent extends AbstractTableComponent {

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'nameInCCU', 'name', 'instanceID', 'control'
    ];

    this.dataSourceSelector = Selectors.selectAllAppliances(false, Models.HapApplicanceType.Program);
    this.loadingSelector = Selectors.appliancesLoading;
    this.searchFields = ['nameInCCU', 'name'];
  }
}
