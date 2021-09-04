import { Component, OnInit } from '@angular/core';
import { CCUChannel } from 'src/app/store/models/CCUDevice.model';


@Component({
  selector: 'app-newdevicewizzard',
  templateUrl: './newdevicewizzard.component.html',
  styleUrls: ['./newdevicewizzard.component.sass']
})
export class NewDevicewizzardComponent implements OnInit {

  channelList: CCUChannel[] = [];
  wizzardStep: number = 0;
  canDoNext: boolean = false;

  constructor() { }


  ngOnInit(): void {

  }

  deviceSelectionChanged(data: any): void {
    if (data.active === true) {
      this.channelList.push(data.id);
    } else {
      this.channelList = this.channelList.filter(channel => channel != data.id);
    }
    this.canDoNext = (this.channelList.length > 0);
  }

  nextStep(): void {
    if (this.wizzardStep < this.channelList.length) {
      this.wizzardStep = this.wizzardStep + 1;
      this.canDoNext = this.channelList.length > this.wizzardStep;
      console.log(this.channelList[this.wizzardStep - 1]);

    } else {
    }
  }
}
