import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { ApplicationService } from 'src/app/service/application.service';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance, HapInstance, HapInstanceCoreData } from 'src/app/store/models';




@Component({
  selector: 'app-wizzard',
  templateUrl: './wizzard.component.html',
  styleUrls: ['./wizzard.component.sass']
})
export class WizzardComponent implements OnInit {

  wizzardStep: number;
  canDoPrevious: boolean;
  canDoNext: boolean;
  canDoFinish: boolean;
  isSaving: boolean;

  instanceListToCreate: HapInstanceCoreData[] = [];
  selectedInstance: HapInstance;
  instanceList: HapInstance[];

  constructor(
    public store: Store<Models.AppState>,
    private appService: ApplicationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.wizzardStep = 0;
    this.canDoNext = true;

    this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.All))).subscribe((devcount) => {
      if (devcount > 0) {
        this.cancelWizzard();
      }
    });

    this.store.pipe(select(Selectors.selectAllInstances)).subscribe(instanceList => {
      this.instanceList = instanceList;
    })

  }

  createInstances() {
    if (this.instanceListToCreate.length > 0) {
      this.store.dispatch(Actions.CreateHapInstanceAtApiAction({ payload: this.instanceListToCreate }));
    }
  }

  previousStep(): void {
    if (this.wizzardStep > 2) {
      this.wizzardStep = this.wizzardStep - 1;
      this.selectedInstance = this.instanceList[this.wizzardStep - 3];
      this.canDoPrevious = (this.wizzardStep > 3);
    }
  }

  nextStep(): void {
    switch (this.wizzardStep) {
      case 0:
        this.wizzardStep = 1;
        this.canDoPrevious = false;
        break;
      case 1:
        this.wizzardStep = 2;
        this.createInstances();
        this.canDoPrevious = false;
        break;
      default:
        if ((this.wizzardStep > 1) && (this.wizzardStep < this.instanceList.length + 2)) {
          this.wizzardStep = this.wizzardStep + 1;
          this.selectedInstance = this.instanceList[this.wizzardStep - 3];
          this.canDoPrevious = (this.wizzardStep > 3);
          this.canDoNext = (this.wizzardStep < this.instanceList.length + 2);
          this.canDoFinish = (this.wizzardStep === this.instanceList.length + 2);
        }
        break;
    }
  }

  cancelWizzard(): void {
    this.store.dispatch(Actions.CleanHapApplianceStore());
    this.router.navigate(['/devices']);
  }




  finish(): void {
    this.isSaving = true;
    const applList = this.appService.selectTemporaryAppliances();
    if (applList !== undefined) {
      const list = applList.filter(app => ((app !== null) && (app !== undefined)));
      setTimeout(() => {
        this.store.dispatch({ type: Actions.HapApplianceActionTypes.SAVE_APPLIANCE_TO_API, payload: list });

        setTimeout(() => { // wait 2 seconds
          this.isSaving = false;
          this.cancelWizzard();
        }, 2000);
      }, 500);
    }

  }
}
