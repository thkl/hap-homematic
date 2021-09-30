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
      const randomID = this.randomID();
      const randomNum = this.randomBytes(1)[0];
      this.socket$ = webSocket({
        url: `${WS_ENDPOINT}/${randomNum}/${randomID}/websocket`,
        deserializer: msg => {
          try { // this is a little weird
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

  private randomID(): string {
    const lgn = 10;
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const bytes = this.randomBytes(lgn);
    let rid = ''

    for (let i = 0; i < lgn; i++) {
      const index = bytes[i] % 26;
      rid += chars.charAt(index);
    }
    return rid;
  }

  private randomBytes(length: number) {
    const bytes = new Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
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
