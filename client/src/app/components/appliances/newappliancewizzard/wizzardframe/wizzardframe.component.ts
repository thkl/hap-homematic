import { Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Actions, Models, Selectors, SelectUtility } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';
import { ValidationResult } from 'src/app/validators/validationResult';
import { AppliancePropertiesComponent } from '../../applianceproperties/applianceproperties.component';

@Component({
  selector: 'app-wizzardframe',
  templateUrl: './wizzardframe.component.html',
  styleUrls: ['./wizzardframe.component.sass']
})
export class NewApplianceWizzardFrameComponent implements OnInit, OnDestroy {

  private channelAdressList: string[] = [];
  public wizzardStep = 0;
  public canDoNext = false;
  public canDoPrevious = false;
  public finishWizzard = false;
  public selectedAppliance: HapAppliance;
  public save: EventEmitter<any> = new EventEmitter();
  public preselectedChannels: string[];
  public wizzardFor: Models.HapApplicanceType;
  private saving = false;
  public validationResult: ValidationResult;
  private ngDestroyed$ = new Subject();

  @ViewChild(AppliancePropertiesComponent) properties: AppliancePropertiesComponent;

  constructor(
    private route: ActivatedRoute,
    public store: Store<Models.AppState>,
    private router: Router) {

  }


  ngOnDestroy(): void {
    this.store.dispatch({ type: Actions.HapApplianceActionTypes.CLEAN_APPLIANCE_STORE });
    this.ngDestroyed$.next();
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
          case 'program':
            this.wizzardFor = Models.HapApplicanceType.Program;
            break;
          case 'special':
            this.wizzardFor = Models.HapApplicanceType.Special;
            this.addChannelToWizzard('new:special');
            this.wizzardStep = 1;
            this.canDoNext = false;
            this.openPrefrences('new:special');
            break;
          default:
            break;
        }
      }
    })

    //Special devices do not have a Device/var/or proram selector
    if (this.wizzardFor !== Models.HapApplicanceType.Special) {
      this.store.pipe(select(
        Selectors.selectAllTemporaryAppliances(Models.HapApplicanceType.All)))
        .pipe(takeUntil(this.ngDestroyed$))
        .subscribe(applList => {
          this.channelAdressList = [];
          applList.forEach(tmpHapAppliance => {
            if (tmpHapAppliance !== undefined) {
              this.channelAdressList.push(tmpHapAppliance.address);
            }
          })
          this.canDoNext = (this.channelAdressList.length > 0);
        });
    }
  }


  addChannelToWizzard(channelAddress: string): void {
    let ccuObject: any;
    let serial: string;
    let channel: string;
    let address: string;
    switch (this.wizzardFor) {
      case Models.HapApplicanceType.Device:
        ccuObject = SelectUtility.getChannel(this.store, Selectors.selectChannelByAddress(channelAddress));
        address = ccuObject.address;
        serial = ccuObject.address.split(':')[0];
        channel = ccuObject.address.split(':')[1];
        break;
      case Models.HapApplicanceType.Variable:
        ccuObject = SelectUtility.getVariable(this.store, Selectors.selectVariableByName(channelAddress));
        address = `${channelAddress}:0`;
        serial = channelAddress;
        channel = "0";
        break;
      case Models.HapApplicanceType.Program:
        ccuObject = SelectUtility.getProgram(this.store, Selectors.selectProgramByName(channelAddress));
        address = `${channelAddress}:0`;
        serial = channelAddress;
        channel = "0";
        break;
      case Models.HapApplicanceType.Special:
        ccuObject = { name: 'New Special Object' };
        address = channelAddress;
        break;
    }
    if (ccuObject) {
      const name = ccuObject.name;
      let usedAppliance = SelectUtility.getAppliance(this.store, Selectors.selectTemporaryApplianceByAddress(channelAddress));
      if (usedAppliance === undefined) {
        usedAppliance = ({
          name,
          serial,
          channel,
          serviceClass: null,
          settings: { settings: {} }, // this is weird but here we are
          nameInCCU: name,
          instances: [],
          isPublished: false,
          address: address,
          applianceType: this.wizzardFor
        });
        // Save it to the store
        this.store.dispatch(Actions.SaveHapApplianceAction({ applianceToSave: usedAppliance }));
      }
    }
  }

  removeChannelFromWizzard(channelAddress: string): void {
    const usedAppliance = SelectUtility.getAppliance(this.store, Selectors.selectTemporaryApplianceByAddress(channelAddress));
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

  dismissAddNew(): void {
    switch (this.wizzardFor) {
      case Models.HapApplicanceType.Device:
        this.router.navigate(['/devices']);
        break;
      case Models.HapApplicanceType.Variable:
        this.router.navigate(['/variables']);
        break;
      case Models.HapApplicanceType.Program:
        this.router.navigate(['/programs']);
        break;
      case Models.HapApplicanceType.Special:
        this.router.navigate(['/special']);
        break;
    }
  }

  saveApplianceLocaly(): boolean {

    if ((this.selectedAppliance) && (this.properties) && (this.properties.validate() === true)) {
      this.properties.save();
      return true;
    }
    return false;
  }

  nextStep(): void {
    if (this.wizzardStep < this.channelAdressList.length) {
      if ((this.saveApplianceLocaly() === true) || (this.wizzardStep === 0)) { // check if we can save / or its the first step
        this.wizzardStep = this.wizzardStep + 1;
        this.canDoNext = this.channelAdressList.length > this.wizzardStep;
        this.canDoPrevious = this.wizzardStep > 0;
        const chnlAddress = this.channelAdressList[this.wizzardStep - 1];
        this.openPrefrences(chnlAddress);
      }
    } else {
      this.canDoNext = false;
    }
  }

  previousStep(): void {
    if (this.wizzardStep > 0) {
      if (this.saveApplianceLocaly() === true) {
        this.wizzardStep = this.wizzardStep - 1;
        this.canDoNext = this.channelAdressList.length > this.wizzardStep;
        this.canDoPrevious = this.wizzardStep > 0;
        if (this.wizzardStep > 0) {
          const chnlAddress = this.channelAdressList[this.wizzardStep - 1];
          this.openPrefrences(chnlAddress);
        }
      } else {
        //update tmp list
        this.preselectedChannels = [];
        this.store.pipe(select(Selectors.selectAllTemporaryAppliances(Models.HapApplicanceType.Device)))
          .pipe(takeUntil(this.ngDestroyed$))
          .subscribe(list => {
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

  openPrefrences(channelAddress: string): void {
    this.selectedAppliance = SelectUtility.getAppliance(this.store, Selectors.selectTemporaryApplianceByAddress(channelAddress));
  }

  finish(): void {
    if (this.saveApplianceLocaly() === true) {
      this.finishWizzard = true;
      this.store.pipe(select(Selectors.appliancesSaving))
        .pipe(takeUntil(this.ngDestroyed$))
        .subscribe(isSaving => {
          if ((this.saving === true) && (isSaving === false)) {
            this.dismissAddNew();
          } else {
            this.saving = isSaving;
          }
        })
    } else {
      this.validationResult = this.properties.getValidatenResult();
    }
  }

}
