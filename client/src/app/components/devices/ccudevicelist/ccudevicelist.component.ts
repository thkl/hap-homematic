import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { ArrayDataSource } from '@angular/cdk/collections';
import { CCUChannel, CCUDevice } from 'src/app/store/models/CCUDevice.model';
import { Models, Selectors } from 'src/app/store';
import { select, Store } from '@ngrx/store';


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

  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new ArrayDataSource(TREE_DATA);
  filterText = '';
  @Output() selectionChanged: EventEmitter<TreeNode> = new EventEmitter();

  private treeList: TreeNode[] = [];

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;


  constructor(public store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectAllAppliances(false))).subscribe(hapdevices => {
      this.store.pipe(select(Selectors.selectAllCCUDevices)).subscribe(ccudeviceList => {
        this.treeList = [];
        ccudeviceList.forEach(device => {
          let dcl = [];
          device.channels.forEach(channel => {
            let exists = (hapdevices.filter(device => `${device.serial}:${device.channel}` === channel.address).length > 0);
            let node: TreeNode = ({ name: channel.name, id: channel.address, pl1: channel.type, children: [], active: false, exists: exists });
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
