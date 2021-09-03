import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { select, Store } from '@ngrx/store';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { filterObjects, sortObject } from 'src/app/service/utility';
import { Models, Selectors } from 'src/app/store';
import { AbstractTableComponent } from '../../abstracttable/abstracttable';

@Component({
  selector: 'app-instancelist',
  templateUrl: './instancelist.component.html',
  styleUrls: ['./instancelist.component.sass']
})
export class InstancelistComponent extends AbstractTableComponent {

  private dataSource: Observable<Models.HapInstance[]>;

  constructor(public store: Store<Models.AppState>) {
    super(store);

    this.displayedColumns = [
      'displayName', 'port', 'room', 'pincode', 'control'
    ];

    this.dataSourceSelector = Selectors.selectAllInstances;
    this.loadingSelector = Selectors.instanceLoadingError;
    this.searchFields = ['displayName', 'name'];
    this.dataSource = this.store.pipe(select(Selectors.selectAllInstances));
  }

  getDataSource(): Observable<any> {
    return this.dataSource;
  }

}