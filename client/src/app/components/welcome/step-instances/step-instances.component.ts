import { ArrayDataSource } from '@angular/cdk/collections';
import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { DEFAULTINSTANCE } from 'src/app/service/application.service';
import { Models, Selectors } from 'src/app/store';
import { HapInstance } from 'src/app/store/models';

const LIST_DATA: HapInstance[] = [];


@Component({
  selector: 'app-step-instances',
  templateUrl: './step-instances.component.html',
  styleUrls: ['./step-instances.component.sass']
})


export class StepInstancesComponent implements OnInit {


  dataSource = new ArrayDataSource(LIST_DATA);


  constructor(
    public store: Store<Models.AppState>
  ) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectAllInstances)).subscribe(instanceList => {
      this.dataSource = new ArrayDataSource(instanceList.filter(instance => instance.id !== DEFAULTINSTANCE));
    })
  }

}
