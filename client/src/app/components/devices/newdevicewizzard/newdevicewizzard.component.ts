import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-newdevicewizzard',
  templateUrl: './newdevicewizzard.component.html',
  styleUrls: ['./newdevicewizzard.component.sass']
})
export class NewDevicewizzardComponent implements OnInit, OnDestroy {

  private channelAdressList: string[] = [];
  public wizzardStep: number = 0;
  public canDoNext: boolean = false;
  public canDoPrevious: boolean = false;
  public finished: boolean = false;
  public selectedAppliance: HapAppliance;
  public save: EventEmitter<any> = new EventEmitter();
  public preselectedChannels: string[];

  constructor(public store: Store<Models.AppState>, private router: Router) { }


  ngOnDestroy(): void {
    this.store.dispatch({ type: Actions.HapDeviceActionTypes.CLEAN_DEVICE_STORE });
  }


  ngOnInit(): void {

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
      this.finished = false;
      this.saveApplianceLocaly();
      this.wizzardStep = this.wizzardStep + 1;
      this.canDoNext = this.channelAdressList.length > this.wizzardStep;
      this.canDoPrevious = this.wizzardStep > 0;
      const chnlAddress = this.channelAdressList[this.wizzardStep - 1];
      this.openPrefrences(chnlAddress);
    } else {
      this.finished = true;
      this.canDoNext = false;
    }
  }

  previousStep() {
    if (this.wizzardStep > 0) {
      this.finished = false;
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
      this.finished = true;
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
            isTemporary: true
          });
          // Save it to the store
          this.store.dispatch({ type: Actions.HapDeviceActionTypes.ADD_DEVICE, payload: usedAppliance });
        }
        // set it as current appliance to edit
        this.selectedAppliance = usedAppliance;
      });
    });
  }

  finish(): void {

  }
}
