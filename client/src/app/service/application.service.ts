import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { combineLatest, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Models, Selectors } from '../store';
import { CCUChannel, CCURoom, HapAppliance } from '../store/models';
import { AccountService } from './account.service';
import { DataService } from './data.service';

export const DEFAULTINSTANCE = 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab';


@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public api: string = environment.api;
  public language = 'de';
  private _roomList: CCURoom[];
  private _systemState: Models.SystemConfig = {};
  public configLoaded = false;
  public globalLoadingIndicator: Observable<boolean[]>;

  constructor(
    private store: Store<Models.AppState>,
    private dataService: DataService,
    private accountService: AccountService,
    private logger: NGXLogger,
    private http: HttpClient
  ) {
    console.log('Booting');
    this.store.pipe(select(Selectors.selectAllRooms)).subscribe(roomList => {
      this._roomList = roomList;
    })


    this.store.pipe(select(Selectors.configData)).subscribe((newConfig) => {
      if ((newConfig !== undefined) && (Object.keys(newConfig).length > 0)) {
        this._systemState = newConfig;
        this.configLoaded = true;
        if ((this._systemState) && (this._systemState.useAuth)) {
          this.accountService.needsAuthentication = this._systemState.useAuth;
        } else {
          this.accountService.needsAuthentication = false;
        }
      }
    })


    this.globalLoadingIndicator = combineLatest([
      this.store.select(Selectors.instancesLoading),
      this.store.select(Selectors.logdataIsLoading),
      this.store.select(Selectors.roomsLoading),
      this.store.select(Selectors.configIsLoading),
      this.store.select(Selectors.localizationIsLoading),
      this.store.select(Selectors.appliancesLoading),
      this.store.select(Selectors.ccuDevicesLoading),
      this.store.select(Selectors.ccuProgramsLoading),
      this.store.select(Selectors.ccuVariablesLoading)]
    )

  }

  setToken(newSid: string): void {
    this.accountService.authenticate(newSid);
  }


  getSystemState(): Models.SystemConfig {
    return this._systemState;
  }

  roomByID(roomid: number): CCURoom {
    return this._roomList.find(room => room.id === roomid);
  }

  roomForChannel(channel: CCUChannel): CCURoom {
    if (this._roomList) {
      const rs = this._roomList.filter(room => {
        return (room.channels.indexOf(channel.id) !== -1)
      })
      return rs.length > 0 ? rs[0] : undefined
    }

    return undefined;
  }

  channelWithAddress(address: string): CCUChannel {
    let channel: CCUChannel;
    this.store.select(Selectors.selectChannelByAddress(address)).pipe(take(1)).subscribe(
      s => channel = s
    );
    return channel;
  }

  selectTemporaryAppliances(): HapAppliance[] {
    let result: HapAppliance[];
    this.store.select(Selectors.selectAllTemporaryAppliances(Models.HapApplicanceType.All)).subscribe(
      s => result = s
    );
    return result;
  }


  getApiURL(): string {
    return this.api;
  }

  httpHeaders(): HttpHeaders {
    if (this.accountService.sid) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `${this.accountService.sid}`
      })
    } else {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }
  }

  loginToCCU(username: string, password: string) {
    this.logger.debug(`loginToCCU`);
    return this.http.post<any>(`${this.api}/login`, { username, password }, { headers: this.httpHeaders() });

  }
}
