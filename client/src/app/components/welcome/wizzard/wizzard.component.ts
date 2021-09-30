import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApplicationService, DEFAULTINSTANCE } from 'src/app/service/application.service';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapInstance, HapInstanceCoreData } from 'src/app/store/models';


@Component({
  selector: 'app-wizzard',
  templateUrl: './wizzard.component.html',
  styleUrls: ['./wizzard.component.sass']
})
export class WizzardComponent implements OnInit, OnDestroy {

  wizzardStep: number;
  canDoPrevious: boolean;
  canDoNext: boolean;
  canDoFinish: boolean;
  isSaving: boolean;

  instanceListToCreate: HapInstanceCoreData[] = [];
  selectedInstance: HapInstance;
  instanceList: HapInstance[];
  private ngDestroyed$ = new Subject();

  constructor(
    public store: Store<Models.AppState>,
    private appService: ApplicationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.wizzardStep = 0;
    this.canDoNext = true;

    this.store.pipe(select(Selectors.selectAppliancesCount(Models.HapApplicanceType.All))).pipe(takeUntil(this.ngDestroyed$)).subscribe((devcount) => {
      if (devcount > 0) {
        this.cancelWizzard();
      }
    });

    this.store.pipe(select(Selectors.selectAllInstances)).pipe(takeUntil(this.ngDestroyed$)).subscribe(instanceList => {
      this.instanceList = instanceList.filter(instance => instance.id !== DEFAULTINSTANCE); // Do not touch the default
    })

  }

  ngOnDestroy() {
    this.ngDestroyed$.next();
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
        this.store.dispatch(Actions.SaveHapApplianceToApiAction({ payload: list }));
        this.store.pipe(select(Selectors.appliancesSaving)).pipe(takeUntil(this.ngDestroyed$)).subscribe((saving => {
          if (saving === false) {
            this.isSaving = false;
            const instancesToActivate = [];
            this.instanceList.forEach(instance => {
              if ((instance.hasPublishedDevices === undefined) || (instance.hasPublishedDevices === false)) {
                instancesToActivate.push(instance.id);
              }
              this.store.dispatch(Actions.ActivateHapInstanceAtApiAction({ instances: instancesToActivate }));
              this.cancelWizzard();
            })
          }
        }))
      }, 500);
    }

  }
}
