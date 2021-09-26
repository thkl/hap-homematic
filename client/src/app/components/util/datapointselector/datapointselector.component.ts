import { ArrayDataSource } from '@angular/cdk/collections';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { LocalizationService } from 'src/app/service/localization.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { CCUChannel, CCUDevice } from 'src/app/store/models';
import { SettingsValidator } from 'src/app/validators/validator';

enum SelectorMode {
  deviceMode = 0,
  channelMode = 1,
  datapointMode = 2
}

enum DataType {
  typeString = 0,
  typeArray = 1,
  typeObject = 2
}

@Component({
  selector: 'datapointselector',
  templateUrl: './datapointselector.component.html',
  styleUrls: ['./datapointselector.component.sass']
})

export class DatapointselectorComponent implements OnInit {


  @Input() set ngModel(newModel: any) {
    this.logger.debug('DatapointselectorComponent::set ngModel', newModel)
    if (Array.isArray(newModel)) {
      this.logger.debug('DatapointselectorComponent::ngModel is a Array -> indexit')
      let index = 0;
      newModel.forEach(nm => {
        this._ngModelArray[index] = nm;
        index = index + 1;
      })
      this._ngModelArray = newModel;
      this.selectionType = DataType.typeArray;
    } else if (typeof newModel === 'string') {
      this.logger.debug('DatapointselectorComponent::ngModel is a string')
      this._ngModelArray[0] = newModel
      this.selectionType = DataType.typeString;
    } else if (typeof newModel === 'object') {
      this.logger.debug('DatapointselectorComponent::ngModel is an object')
      this._ngModelArray = newModel;
      this.selectionType = DataType.typeObject;
    }

  }

  _ngModelArray: { [key: string]: any } = {}

  @Output() ngModelChange: EventEmitter<any> = new EventEmitter();

  @Input() set selectorType(newType: string) {
    switch (newType) {
      case "text_control_array":
        this.selectionType = DataType.typeObject;
        break;
      case "text":
        this.selectionType = DataType.typeString;
        break;
    }
  }

  @Input() id: string;

  @Input() set validator(newValidator: SettingsValidator) {
    newValidator.result.resultChanged.subscribe(whatChanged => {
      if (whatChanged === this.id) {
        const message = (newValidator.getMessage(this.id));
        if (message) {
          this.validationError = this.localizationService.l18n(message.message, [message.objectName]);
        }
      }
    })
  }


  @Input() channelTypes: string[];
  devices: CCUDevice[];
  selectedDevice: CCUDevice;
  selectedChannel: CCUChannel;
  currentSelectorStep: SelectorMode;
  @Input() selectorMode: SelectorMode;
  selectionType: DataType = DataType.typeString;
  currentSelectedIndex: string;

  dataSource: ArrayDataSource<any>;
  @ViewChild('closeModal') closeModal: ElementRef;

  public validationError: string;

  constructor(
    private configService: SystemconfigService,
    private localizationService: LocalizationService,
    private logger: NGXLogger
  ) {

  }

  ngOnInit(): void {
    this.reset();

  }

  setIndex(newIndex: string) {
    this.logger.debug(`DatapointselectorComponent::SelectedIndex (${newIndex})`)
    this.currentSelectedIndex = newIndex;
  }

  removeItem(index: string) {
    this.logger.debug(`DatapointselectorComponent::removeItem (${index})`)
    delete this._ngModelArray[index];
    this.ngModelChange.emit(this._ngModelArray);
  }

  reset() {
    this.logger.debug('DatapointselectorComponent::reset');

    this.selectedDevice = undefined;
    this.currentSelectorStep = 0;

    this.configService.loadDevicesByChannelTypes(this.channelTypes).subscribe(list => {
      this.devices = list.devices;
      const deviceList = [];
      this.devices.forEach(device => {
        deviceList.push({ address: device.device, name: unescape(device.name) })
      })
      this.dataSource = new ArrayDataSource(deviceList);
    })
  }

  selectDeviceOrChannel(deviceOrChannel: any): void {
    switch (this.currentSelectorStep) {
      case 0: {
        const rsl = this.devices.find(device => (device.device === deviceOrChannel.address));
        if (rsl) {
          const channelList = [];
          this.selectedDevice = rsl;
          this.selectedDevice.channels.forEach(channel => {
            if (this.channelTypes.indexOf(channel.type) > -1) {
              channelList.push({ id: channel.id, address: channel.address, name: unescape(channel.name) });
            }
          });
          this.dataSource = new ArrayDataSource(channelList);
          this.currentSelectorStep = 1;
        }
      }
        break;
      case 1: {
        // this is a channel selector so we are done
        if (this.selectorMode === SelectorMode.channelMode) {
          this.selectChannel(deviceOrChannel.address);
        } else {
          // this is a datapoint selector so go to page 3
          this.configService.loadChannelDatapoints(deviceOrChannel.id).subscribe(result => {
            this.currentSelectorStep = 2;
            this.dataSource = new ArrayDataSource(result.datapoints);
          })
        }
      }
    }

  }

  goBack(): void {
    switch (this.currentSelectorStep) {
      case 0:
        break;
      case 1:
        this.currentSelectorStep = 0;
        this.reset();
        break;
      case 2:
        this.currentSelectorStep = 0;
        this.selectDeviceOrChannel({ address: this.selectedDevice.device });
        break;
    }
  }

  doChange($event): void {
    this.ngModelChange.emit($event.target.value);
  }

  selectDatapoint(datapointName: string): void {
    switch (this.selectionType) {
      case DataType.typeString:
        this.logger.debug(`DatapointselectorComponent::selectDatapoint ${datapointName} (set for string)`)
        this.ngModelChange.emit(datapointName);
        break;
      case DataType.typeArray:
        this.ngModelChange.emit(this._ngModelArray[0]);
        break;
      case DataType.typeObject:
        this.logger.debug(`DatapointselectorComponent::selectDatapoint ${datapointName} (set for ${this.currentSelectedIndex} Object)`, this._ngModelArray)
        this._ngModelArray[this.currentSelectedIndex] = datapointName;
        this.ngModelChange.emit(this._ngModelArray);
        break;
    }
    this.closeModal.nativeElement.click();
  }

  selectChannel(channel: string): void {
    switch (this.selectionType) {
      case DataType.typeString:
        this.logger.debug(`DatapointselectorComponent::selectChannel ${channel} (set for string)`)
        this.ngModelChange.emit(channel);
        break;
      case DataType.typeArray:
        this._ngModelArray[0][this.currentSelectedIndex] = channel;
        this.ngModelChange.emit(this._ngModelArray[0]);
        break;
      case DataType.typeObject:
        this.logger.debug(`DatapointselectorComponent::selectChannel ${channel} (set for ${this.currentSelectedIndex} Object)`, this._ngModelArray)
        this._ngModelArray[this.currentSelectedIndex] = channel;
        this.ngModelChange.emit(this._ngModelArray);
        break;
    }
    this.closeModal.nativeElement.click();
  }

  addElement() {
    this.logger.debug(`DatapointselectorComponent::addElement for selectionType ${this.selectionType}`)
    switch (this.selectionType) {
      case DataType.typeObject:
        {
          const ids = Object.keys(this._ngModelArray);
          let lastID = parseInt(ids[ids.length - 1]);
          if (isNaN(lastID)) {
            lastID = 0;
          }
          this._ngModelArray[lastID + 1] = '';
        }
    }
    this.ngModelChange.emit(this._ngModelArray);
  }

  sortData($event): void {
    console.log($event);
  }

}
