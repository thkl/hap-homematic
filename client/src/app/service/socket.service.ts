import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';

const rgx = /a\["(.*)"\]/

export const WS_ENDPOINT = environment.wsEndpoint;

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket$: WebSocketSubject<any>;

  constructor(
    private logger: NGXLogger
  ) { }

  public connect(): WebSocketSubject<any> {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket({
        url: WS_ENDPOINT,
        deserializer: msg => {
          // If for some reason you want the whole response from AWS (you'll have to parse .data yourself)
          // return msg;

          // try to parse message as json. If we can't, just return whatever it is (usually bare string)
          try {


            const pmsg = msg.data.match(rgx);
            if ((pmsg) && (pmsg.length > 0)) {
              return JSON.parse(pmsg[1].replace(/\\"/g, '"'));
            }
            return undefined

          } catch (e) {

            return undefined
          }
        }
      });
      this.logger.debug(`Connecting to ws endpoint ${WS_ENDPOINT}`);
    }
    return this.socket$;
  }

  public dataUpdates$() {
    return this.connect().asObservable();
  }

  closeConnection() {
    this.connect().complete();
  }

  sendMessage(msg: any) {
    this.socket$.next(msg);
  }

}
