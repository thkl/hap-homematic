import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance, HapApplicanceType } from 'src/app/store/models';

@Component({
  selector: 'app-wizzardframe',
  templateUrl: './wizzardframe.component.html',
  styleUrls: ['./wizzardframe.component.sass']
})
export class NewApplianceWizzardFrameComponent implements OnInit, OnDestroy {

  private channelAdressList: string[] = [];
  public wizzardStep: number = 0;
  public canDoNext: boolean = false;
  public canDoPrevious: boolean = false;
  public finishWizzard: boolean = false;
  public selectedAppliance: HapAppliance;
  public save: EventEmitter<any> = new EventEmitter();
  public preselectedChannels: string[];

  constructor(public store: Store<Models.AppState>, private router: Router) { }


  ngOnDestroy(): void {
    this.store.dispatch({ type: Actions.HapApplianceActionTypes.CLEAN_APPLIANCE_STORE });
  }


  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectTemporaryAppliances)).subscribe(applList => {
      this.channelAdressList = [];
      applList.forEach(tmpHapAppliance => {
        this.channelAdressList.push(tmpHapAppliance.address);
      })
    });
  }

  deviceSelectionChanged(data: any): void {
    if (data.active === true) {
      this.channelAdressList.push(data.id);
    } else {
      this.channelAdressList = this.channelAdressList.filter(channel => channel != data.id);
    }
    this.canDoNext = (this.channelAdressList.length > 0);
  }

  cancelAddNew(): void {
    this.router.navigate(['devices']);
  }

  saveApplianceLocaly() {
    if (this.selectedAppliance) {
      this.save.emit();
    }
  }

  nextStep(): void {
    if (this.wizzardStep < this.channelAdressList.length) {
      this.saveApplianceLocaly();
      this.wizzardStep = this.wizzardStep + 1;
      this.canDoNext = this.channelAdressList.length > this.wizzardStep;
      this.canDoPrevious = this.wizzardStep > 0;
      const chnlAddress = this.channelAdressList[this.wizzardStep - 1];
      this.openPrefrences(chnlAddress);
    } else {
      this.canDoNext = false;
    }
  }

  previousStep() {
    if (this.wizzardStep > 0) {
      this.saveApplianceLocaly();
      this.wizzardStep = this.wizzardStep - 1;
      this.canDoNext = this.channelAdressList.length > this.wizzardStep;
      this.canDoPrevious = this.wizzardStep > 0;
      if (this.wizzardStep > 0) {
        const chnlAddress = this.channelAdressList[this.wizzardStep - 1];
        this.openPrefrences(chnlAddress);
      } else {
        //update tmp list
        this.preselectedChannels = [];
        this.store.pipe(select(Selectors.selectTemporaryAppliances)).subscribe(list => {
          list.forEach(appliance => {
            this.preselectedChannels.push(appliance.address);
          })
        })
      }
    } else {
      this.canDoNext = true;
      this.canDoPrevious = false;
    }

  }

  openPrefrences(chnlAddress: string) {
    this.store.pipe(select(Selectors.selectChannelByAddress(chnlAddress))).subscribe(ccuChannel => {
      const serial = ccuChannel.address.split(':')[0];
      const channel = ccuChannel.address.split(':')[1];
      const name = ccuChannel.name;
      // try to get the evtl. prevoiusly saved temp appliance from the store
      this.store.pipe(select(Selectors.selectApplianceByAddress(ccuChannel.address))).subscribe(usedAppliance => {
        if (usedAppliance === undefined) {
          usedAppliance = ({
            name,
            serial,
            channel,
            serviceClass: null,
            settings: {},
            nameInCCU: name,
            instanceNames: '',
            isPublished: false,
            address: ccuChannel.address,
            isTemporary: true,
            applianceType: HapApplicanceType.Device
          });
          // Save it to the store
          this.store.dispatch({ type: Actions.HapApplianceActionTypes.ADD_APPLIANCE, payload: usedAppliance });
        }
        // set it as current appliance to edit
        this.selectedAppliance = usedAppliance;
      });
    });
  }

  finish(): void {
    this.finishWizzard = true;
  }
}
