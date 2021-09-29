import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, Models } from '../store';
import { HapApplianceLoadResult } from '../store/models';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private socketService: SocketService,
    public store: Store<Models.AppState>
  ) {

    const subject = this.socketService.connect();


    subject.subscribe(
      msg => {
        if ((msg) && (msg.message)) {
          this.handleMessage(msg.message, msg.payload)
        }
      },
      err => {
        console.log(err)
      },
      () => {
        console.log('complete')
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

      if (payload.bridges) {
        this.store.dispatch(Actions.LoadHapInstanceSuccessAction({ payload: payload.bridges }));
      }
    }
  }

}
