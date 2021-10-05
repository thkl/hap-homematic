import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { AbstractTableComponent } from 'src/app/components/abstracttable/abstracttable';
import { ApplicationService } from 'src/app/service/application.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-variablelist',
  templateUrl: './variablelist.component.html',
  styleUrls: ['./variablelist.component.sass'],
})
export class VariablelistComponent extends AbstractTableComponent implements OnInit {
  confirmId = 'deleteVariable';
  virtualKeys = [];
  currentTrigger: string;
  createHelper: boolean;

  constructor(
    public store: Store<Models.AppState>,
    private systemConfigService: SystemconfigService,
    private applicationService: ApplicationService
  ) {
    super(store);

    this.displayedColumns = [
      'nameInCCU',
      'name',
      'serviceClass',
      'instanceID',
      'controlEdit',
      'controlDelete'
    ];

    this.dataSourceSelector = Selectors.selectAllAppliances(Models.HapApplicanceType.Variable);
    this.loadingSelector = Selectors.appliancesLoading;
    this.searchFields = ['nameInCCU', 'name'];
  }

  ngOnInit() {
    super.ngOnInit();
    this.systemConfigService.loadVirtualKeys().subscribe((result) => {
      this.virtualKeys = [];
      result.virtualkeys.forEach(keyDevice => {
        keyDevice.channels.forEach(channel => {
          this.virtualKeys.push({ name: channel.name, dp: `${keyDevice.ifName}.${channel.address}.PRESS_SHORT` })
        })
      })
    });

    this.addSubscription(
      this.store.pipe(select(Selectors.selectVariableTrigger)).subscribe(trigger => {
        this.currentTrigger = trigger;
      })
    )

    this.addSubscription(
      this.store.pipe(select(Selectors.selectCreateVariableHelper)).subscribe(helper => {
        this.createHelper = helper;
      })
    )
  }

  updateVariableTrigger(): void {
    this.store.dispatch(Actions.SaveVariableTriggerToApiAction({ datapoint: this.currentTrigger, createhelper: this.createHelper }));
  }

  deleteVariable(applianceToDelete: HapAppliance): void {
    this.store.dispatch(Actions.DeleteHapApplianceFromApiAction({ applianceToDelete }));
  }
}
