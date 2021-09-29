import { ArrayDataSource } from '@angular/cdk/collections';
import { Component, Input } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { ApplicationService } from 'src/app/service/application.service';
import { Actions, Models, Selectors } from 'src/app/store';
import { CCUChannel, HapAppliance, HapApplicanceType, HapInstance } from 'src/app/store/models';

interface ListNode {
  active: boolean;
  channel: CCUChannel;
  displayName: string;
}

const LIST_DATA: ListNode[] = [];

@Component({
  selector: 'app-step-appliances',
  templateUrl: './step-appliances.component.html',
  styleUrls: ['./step-appliances.component.sass']
})
export class StepAppliancesComponent {

  dataSource = new ArrayDataSource(LIST_DATA);
  listData: ListNode[];
  roomName: string;

  @Input() set instance(aInstance: HapInstance) {
    this._instance = aInstance;
    const room = this.appService.roomByID(aInstance.roomId);
    if (room) {
      this.roomName = room.name;
      this.store.pipe(select(Selectors.selectAllChannels)).subscribe(channelList => {
        const clInRoom = channelList.filter(channel => (room.channels.indexOf(channel.id) > -1));
        this.listData = [];
        clInRoom.forEach(channel => {
          let isActive = false;
          let displayName = channel.name
          // check if we have the appliance from a go back or so
          const tmpAppliance = this.tempApplianceWithAddress(channel.address);
          if (tmpAppliance !== undefined) {
            isActive = true;
            displayName = tmpAppliance.name;
          }
          this.listData.push({ active: isActive, channel, displayName });
        })
        this.dataSource = new ArrayDataSource(this.listData);
      })
    }
  }

  _instance: HapInstance;

  constructor(
    public store: Store<Models.AppState>,
    private appService: ApplicationService
  ) { }

  tempApplianceWithAddress(address: string): HapAppliance {
    let appliance: HapAppliance;
    this.store.select(Selectors.selectTemporaryApplianceByAddress(address)).pipe(take(1)).subscribe(
      s => appliance = s
    );
    return appliance;
  }



  select(row): void {
    const ccuChannel: CCUChannel = row.channel;
    if (row.active === true) {

      const address = ccuChannel.address;
      const adrParts = address.split(':');
      const serial = adrParts[0];
      const channel = adrParts[1];
      const tempAppliance: HapAppliance = {
        name: row.displayName,
        address,
        serial,
        channel,
        nameInCCU: ccuChannel.name,
        settings: {},
        isPublished: false,
        applianceType: HapApplicanceType.Device,
        serviceClass: '',
        instances: [{ id: this._instance.id }]
      }
      this.store.dispatch(Actions.SaveHapApplianceAction({ applianceToSave: tempAppliance }));
    } else {
      const tmpAppliance = this.tempApplianceWithAddress(ccuChannel.address);
      if (tmpAppliance) {
        this.store.dispatch(Actions.DeleteTemporaryHapApplianceAction({ payload: tmpAppliance }));
      }
    }
  }
}
