import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { select, Store } from '@ngrx/store';
import { fromEvent, Observable, Subject, Subscription } from 'rxjs';
import { Models, Selectors } from 'src/app/store';
import { AbstractTableComponent } from '../../abstracttable/abstracttable';

@Component({
  selector: 'app-speciallist',
  templateUrl: './speciallist.component.html',
  styleUrls: ['./speciallist.component.sass']
})
export class SpeciallistComponent extends AbstractTableComponent {

  constructor(public store: Store<Models.AppState>) {
    super(store);
    this.displayedColumns = [
      'serial',
      'name',
      'serviceClass',
      'instanceID',
      'control',
    ];

    this.dataSource = this.store.pipe(select(Selectors.selectAllSpecialDevices));
  }


}
