import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { ArrayDataSource } from '@angular/cdk/collections';
import { Selectors } from 'src/app/store';
import { select, Store } from '@ngrx/store';
import { Models } from 'src/app/store/';
import { take } from 'rxjs/operators';


interface TreeNode {
  name: string;
  id: string;
  pl1?: string;
  active: boolean;
  exists: boolean;
  children: TreeNode[]
}

const TREE_DATA: TreeNode[] = [];


@Component({
  selector: 'app-ccudevicelist',
  templateUrl: './ccudevicelist.component.html',
  styleUrls: ['./ccudevicelist.component.sass']
})
export class CCCUDevicelistComponent implements OnInit {

  @Input() preselectedChannels: string[];

  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new ArrayDataSource(TREE_DATA);
  filterText = '';
  @Output() selectionChanged: EventEmitter<TreeNode> = new EventEmitter();

  private treeList: TreeNode[] = [];

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;


  constructor(public store: Store<Models.AppState>) { }

  ngOnInit(): void {
    if (this.preselectedChannels === undefined) {
      this.preselectedChannels = [];
    }
    // we have to do this once cause the store will change on every selection
    this.store.select(Selectors.selectAllAppliances(Models.HapApplicanceType.Device)).subscribe(hapdevices => {

      this.store.pipe(select(Selectors.selectAllCCUDevices)).subscribe(ccudeviceList => {
        this.treeList = [];
        ccudeviceList.forEach(device => {
          let dcl = [];
          device.channels.forEach(channel => {
            const exists = (hapdevices.filter(device => `${device.serial}:${device.channel}` === channel.address).length > 0);
            const active = (this.preselectedChannels.indexOf(channel.address) !== -1);
            let node: TreeNode = ({ name: channel.name, id: channel.address, pl1: channel.type, children: [], active, exists });
            dcl.push(node);
          })
          this.treeList.push({ name: device.name, id: device.device, children: dcl, active: false, exists: false });
        })
        this.rebuildTree()
      })
    })
  }

  select(node) {
    this.selectionChanged.emit(node);
  }

  rebuildTree() {
    // create a filtered list
    let treeList = [];
    this.treeList.forEach(treeNode => {
      if ((this.filterText.length === 0) || (treeNode.name.toLocaleLowerCase().indexOf(this.filterText.toLocaleLowerCase()) > -1)) {
        treeList.push(treeNode);
      }
    })
    this.dataSource = new ArrayDataSource(treeList);
  }


}
