import { ArrayDataSource } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';
import { HapInstanceCoreData } from 'src/app/store/models';

interface ListNode {
  name: string;
  id: number;
  numChannels?: number;
  active: boolean;
  displayName: string;
}

const LIST_DATA: ListNode[] = [];

@Component({
  selector: 'app-ccuroomlist',
  templateUrl: './ccuroomlist.component.html',
  styleUrls: ['./ccuroomlist.component.sass']
})
export class CCURoomlistComponent implements OnInit {


  @Output() instanceListChange: EventEmitter<any> = new EventEmitter();
  @Input() instanceList: HapInstanceCoreData[];

  dataSource = new ArrayDataSource(LIST_DATA);
  listData: ListNode[];

  constructor(
    public store: Store<Models.AppState>
  ) { }

  ngOnInit(): void {

    if (this.instanceList === undefined) {
      this.instanceList = [];
    }

    this.store.pipe(select(Selectors.selectAllRooms)).subscribe(ccuRoomList => {
      this.listData = [];
      ccuRoomList.forEach(room => {
        const active = this.instanceList.some(instance => instance.roomId === room.id)
        this.listData.push({ id: room.id, name: room.name, active, numChannels: room.channels.length, displayName: room.name })
      })
      this.fillList();
    })
  }

  fillList(): void {
    this.dataSource = new ArrayDataSource(this.listData);
  }

  select(node): void {
    if (node.active) {
      this.instanceList.push({ roomId: node.id, displayName: node.displayName });
    } else {
      this.instanceList = this.instanceList.filter(instance => (instance.roomId !== node.id))
    }
    this.instanceListChange.emit(this.instanceList);
  }

  instanceNameChange(node): void {
    this.instanceList.some(instance => {
      if (instance.roomId === node.id) {
        instance.displayName = node.displayName;
      }
    })
  }

  sortData(event): void {
    console.log(event);
  }

}
