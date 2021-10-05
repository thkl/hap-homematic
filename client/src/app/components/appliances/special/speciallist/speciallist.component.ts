import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AbstractTableComponent } from 'src/app/components/abstracttable/abstracttable';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-speciallist',
  templateUrl: './speciallist.component.html',
  styleUrls: ['./speciallist.component.sass']
})
export class SpeciallistComponent extends AbstractTableComponent {

  confirmId = 'deleteSpecial';

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'name',
      'serviceClass',
      'instanceID',
      'controlEdit',
      'controlDelete'
    ];

    this.dataSourceSelector = Selectors.selectAllAppliances(Models.HapApplicanceType.Special);
    this.loadingSelector = Selectors.appliancesLoading;
  }


  deleteSpecial(applianceToDelete: HapAppliance): void {
    this.store.dispatch(Actions.DeleteHapApplianceFromApiAction({ applianceToDelete }));
  }
}
