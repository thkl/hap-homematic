import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, Models } from '../store';
import { CCUDeviceLoadingResult, HapApplianceLoadResult } from '../store/models';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private socketService: SocketService,
    public store: Store<Models.AppState>
  ) {
    this.connect();
  }

  connect(): void {
    const subject = this.socketService.connect();


    subject.subscribe(
      msg => {
        if ((msg) && (msg.message)) {
          this.handleMessage(msg.message, msg.payload)
        }
      },
      err => {
        console.log('Socket Error %s', err)
        setTimeout(() => { this.connect() }, 10000);
      },
      () => {
        console.log('Socket Closed')
      }
    );

    subject.next({ command: "hello" });
  }

  handleMessage(message: string, payload: any): void {
    if (message === 'serverdata') {
      if (payload.appliances) {
        const dta: HapApplianceLoadResult = { appliances: payload.appliances, varTrigger: payload.varTrigger };
        this.store.dispatch(Actions.LoadHapAppliancesSuccessAction({ loadingResult: dta }));
      }

      if (payload.ccuDevices) {
        const dta: CCUDeviceLoadingResult = { devices: payload.ccuDevices };
        this.store.dispatch(Actions.LoadCCUDevicesSuccessAction({ result: dta }));
      }
    }

    if (message === 'instances') {
      this.store.dispatch(Actions.LoadHapInstanceSuccessAction({ payload }));
    }

    if (message === 'heartbeat') {
      this.store.dispatch(Actions.LoadSystemConfigSuccessAction({ systemConfig: payload }));
    }
  }

}
