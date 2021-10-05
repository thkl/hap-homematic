import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AbstractTableComponent } from 'src/app/components/abstracttable/abstracttable';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-programlist',
  templateUrl: './programlist.component.html',
  styleUrls: ['./programlist.component.sass'],
})
export class ProgramlistComponent extends AbstractTableComponent {
  confirmId = 'deleteProgram';

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'nameInCCU', 'name', 'instanceID', 'controlEdit',
      'controlDelete'
    ];

    this.dataSourceSelector = Selectors.selectAllAppliances(Models.HapApplicanceType.Program);
    this.loadingSelector = Selectors.appliancesLoading;
    this.searchFields = ['nameInCCU', 'name'];
  }


  deleteProgram(applianceToDelete: HapAppliance): void {
    this.store.dispatch(Actions.DeleteHapApplianceFromApiAction({ applianceToDelete }));
  }
}
