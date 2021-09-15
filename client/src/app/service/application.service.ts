import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Actions, Models, Selectors } from '../store';
import { CCUChannel, CCUDevice, CCURoom } from '../store/models';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public api: string = environment.api;
  public language: string = 'de';
  private _roomList: CCURoom[];

  constructor(private store: Store<Models.AppState>) {
    console.log('Booting');

    this.store.pipe(select(Selectors.selectAllRooms)).subscribe(roomList => {
      this._roomList = roomList;
    })

  }

  roomForChannel(channel: CCUChannel): CCURoom {
    if (this._roomList) {
      let rs = this._roomList.filter(room => {
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
}
