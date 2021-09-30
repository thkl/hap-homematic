import { ArrayDataSource } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Models, Selectors } from 'src/app/store';


interface ListNode {
  name: string;
  id: string;
  pl1?: string;
  active: boolean;
  exists: boolean;
}

const LIST_DATA: ListNode[] = [];

@Component({
  selector: 'app-ccuvariablelist',
  templateUrl: './ccuvariablelist.component.html',
  styleUrls: ['./ccuvariablelist.component.sass']
})
export class CCUVariablelistComponent implements OnInit, OnDestroy {

  @Output() selectionChanged: EventEmitter<ListNode> = new EventEmitter();
  @Input() preselectedVariables: string[];
  dataSource = new ArrayDataSource(LIST_DATA);
  listData: ListNode[];
  searchText: string;
  private ngDestroyed$ = new Subject();

  constructor(
    public store: Store<Models.AppState>
  ) { }

  ngOnInit(): void {

    if (this.preselectedVariables === undefined) {
      this.preselectedVariables = [];
    }
    // we have to do this once cause the store will change on every selection
    this.store.select(Selectors.selectAllAppliances(Models.HapApplicanceType.Variable))
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe(hapdevices => {
        this.store.pipe(select(Selectors.selectAllCCUVariables))
          .pipe(takeUntil(this.ngDestroyed$))
          .subscribe(ccuvariableList => {
            this.listData = [];
            ccuvariableList.forEach(variable => {
              const exists = (hapdevices.filter(device => `${device.address}` === `${variable.name}:0`).length > 0);
              const active = (this.preselectedVariables.indexOf(variable.name) !== -1);
              this.listData.push({ id: variable.name, name: variable.name, active, exists })
            })
            this.fillList();
          })
      })
  }

  ngOnDestroy() {
    this.ngDestroyed$.next();
  }

  select(node): void {
    this.selectionChanged.emit(node);
  }

  fillList(): void {
    this.dataSource = new ArrayDataSource(this.listData);
  }

  sortData(event): void {
    console.log(event);
  }
}
