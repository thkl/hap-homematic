import { Component, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-newdevicewizzard',
  templateUrl: './newdevicewizzard.component.html',
  styleUrls: ['./newdevicewizzard.component.sass']
})
export class NewDevicewizzardComponent implements OnInit {

  channelAdressList: string[] = [];
  wizzardStep: number = 0;
  canDoNext: boolean = false;
  selectedAppliance: HapAppliance;
  public save: EventEmitter<any> = new EventEmitter();


  constructor(public store: Store<Models.AppState>, private router: Router) { }


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
    this.store.dispatch({ type: Actions.HapDeviceActionTypes.CLEAN_DEVICE_STORE })
    this.router.navigate(['devices']);
  }

  nextStep(): void {
    if (this.wizzardStep < this.channelAdressList.length) {
      this.wizzardStep = this.wizzardStep + 1;
      this.canDoNext = this.channelAdressList.length > this.wizzardStep;
      let chnlAddress = this.channelAdressList[this.wizzardStep - 1];
      this.store.pipe(select(Selectors.selectChannelByAddress(chnlAddress))).subscribe(ccuChannel => {
        const serial = ccuChannel.address.split(':')[0];
        const channel = ccuChannel.address.split(':')[1];
        const name = ccuChannel.name;
        const appl: HapAppliance = ({
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

        this.store.dispatch({ type: Actions.HapDeviceActionTypes.ADD_DEVICE, payload: appl });
        this.selectedAppliance = appl;
      });

    } else {
    }
  }
}
