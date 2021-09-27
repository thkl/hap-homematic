import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Models, Selectors } from '../store';
import { CCUChannel, CCURoom } from '../store/models';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public api: string = environment.api;
  public language = 'de';
  private _roomList: CCURoom[];
  private _systemState: Models.SystemConfig = {};
  public globalLoadingIndicator: Observable<boolean[]>;

  constructor(private store: Store<Models.AppState>) {
    console.log('Booting');

    this.store.pipe(select(Selectors.selectAllRooms)).subscribe(roomList => {
      this._roomList = roomList;
    })


    this.store.pipe(select(Selectors.configData)).subscribe((newConfig) => {
      if (newConfig) {
        this._systemState = newConfig;
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

  getSystemState(): Models.SystemConfig {
    return this._systemState;
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

  getApiURL():string {
    return this.api;
  }

}
