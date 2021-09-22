import { ArrayDataSource } from '@angular/cdk/collections';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { LocalizationService } from 'src/app/service/localization.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { CCUChannel, CCUDevice } from 'src/app/store/models';
import { SettingsValidator } from 'src/app/validators/validator';

enum SelectorMode {
  deviceMode = 0,
  channelMode = 1,
  datapointMode = 2
}


@Component({
  selector: 'datapointselector',
  templateUrl: './datapointselector.component.html',
  styleUrls: ['./datapointselector.component.sass']
})

export class DatapointselectorComponent implements OnInit {

  @Input() ngModel: string;
  @Output() ngModelChange: EventEmitter<any> = new EventEmitter();

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
  @Input() singleSelection = true;

  dataSource: ArrayDataSource<any>;
  @ViewChild('closeModal') closeModal: ElementRef;

  public validationError: string;

  constructor(
    private configService: SystemconfigService,
    private localizationService: LocalizationService
  ) {

  }

  ngOnInit(): void {
    this.reset();

  }

  reset() {
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
    this.ngModel = datapointName;
    this.closeModal.nativeElement.click();
    this.ngModelChange.emit(datapointName);
  }

  selectChannel(channel: string): void {
    this.ngModel = channel;
    this.closeModal.nativeElement.click();
    this.ngModelChange.emit(channel);
  }

  sortData($event): void {
    console.log($event);
  }

}
