import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Selector, Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapAppliance, HapApplicanceType } from 'src/app/store/models';
import { CCUChannel, CCUVariable } from 'src/app/store/models/CCUObjects.model';

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
  public wizzardFor: Models.HapApplicanceType;

  constructor(
    private route: ActivatedRoute,
    public store: Store<Models.AppState>,
    private router: Router) {

  }


  ngOnDestroy(): void {
    this.store.dispatch({ type: Actions.HapApplianceActionTypes.CLEAN_APPLIANCE_STORE });
  }


  ngOnInit(): void {
    this.route.url.subscribe((url) => {
      if (url.length > 1) {
        switch (url[0].path) {
          case 'device':
            this.wizzardFor = Models.HapApplicanceType.Device;
            break;
          case 'variable':
            this.wizzardFor = Models.HapApplicanceType.Variable;
            break;
          default:
            break;
        }
      }
    })

    this.store.pipe(select(Selectors.selectAllTemporaryAppliances(Models.HapApplicanceType.All))).subscribe(applList => {
      this.channelAdressList = [];
      applList.forEach(tmpHapAppliance => {
        this.channelAdressList.push(tmpHapAppliance.address);
      })
      this.canDoNext = (this.channelAdressList.length > 0);
    });
  }

  getVariable(selector: any): CCUVariable {
    let variable: CCUVariable;
    this.store.select(selector).pipe(take(1)).subscribe(
      s => variable = s
    );
    return variable;
  }

  getChannel(selector: any): CCUChannel {
    let channel: CCUChannel;
    this.store.select(selector).pipe(take(1)).subscribe(
      s => channel = s
    );
    return channel;
  }

  getAppliance(selector: any): HapAppliance {
    let appliance: HapAppliance;
    this.store.select(selector).pipe(take(1)).subscribe(
      s => appliance = s
    );
    return appliance;
  }

  addChannelToWizzard(channelAddress: string): void {
    let ccuObject: any;
    let serial: string;
    let channel: string;
    let address: string;
    switch (this.wizzardFor) {
      case Models.HapApplicanceType.Device:
        ccuObject = this.getChannel(Selectors.selectChannelByAddress(channelAddress));
        address = ccuObject.address;
        serial = ccuObject.address.split(':')[0];
        channel = ccuObject.address.split(':')[1];
        break;
      case Models.HapApplicanceType.Variable:
        ccuObject = this.getVariable(Selectors.selectVariableByName(channelAddress));
        address = `${channelAddress}:0`;
        serial = channelAddress;
        channel = "0";
        break;
    }


    const name = ccuObject.name;
    let usedAppliance = this.getAppliance(Selectors.selectTemporaryApplianceByAddress(channelAddress));
    if (usedAppliance === undefined) {
      usedAppliance = ({
        name,
        serial,
        channel,
        serviceClass: null,
        settings: { settings: {} }, // this is weird but here we are
        nameInCCU: name,
        instanceNames: '',
        isPublished: false,
        address: address,
        applianceType: this.wizzardFor
      });
      // Save it to the store
      this.store.dispatch({ type: Actions.HapApplianceActionTypes.ADD_APPLIANCE, payload: usedAppliance });
    }
  }

  removeChannelFromWizzard(channelAddress: string): void {
    let usedAppliance = this.getAppliance(Selectors.selectTemporaryApplianceByAddress(channelAddress));
    if (usedAppliance !== undefined) {
      // dispatch a delete list will be updated by the store selector
      this.store.dispatch({ type: Actions.HapApplianceActionTypes.DELETE_TMP_APPLIANCE, payload: usedAppliance });
    }
  }

  deviceSelectionChanged(data: any): void {
    if (data.active === true) {
      this.addChannelToWizzard(data.id);
    } else {
      this.removeChannelFromWizzard(data.id);
    }
  }

  cancelAddNew(): void {
    switch (this.wizzardFor) {
      case Models.HapApplicanceType.Device:
        this.router.navigate(['/devices']);
        break;
      case Models.HapApplicanceType.Variable:
        this.router.navigate(['/variables']);
        break;
    }
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
        this.store.pipe(select(Selectors.selectAllTemporaryAppliances(Models.HapApplicanceType.Device))).subscribe(list => {
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

  openPrefrences(channelAddress: string) {
    this.store.pipe(select(Selectors.selectTemporaryApplianceByAddress(channelAddress))).subscribe(usedAppliance => {
      // set it as current appliance to edit
      this.selectedAppliance = usedAppliance;
    });
  }

  finish(): void {
    this.finishWizzard = true;
  }
}
