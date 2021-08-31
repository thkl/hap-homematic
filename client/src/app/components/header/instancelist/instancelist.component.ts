import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-header-instancelist',
  templateUrl: './instancelist.component.html',
  styleUrls: ['./instancelist.component.sass'],
})
export class InstancelistHeaderComponent implements OnInit {
  public hapInstanceList: Models.HapInstance[];
  public hapInstanceCnt: number;

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectInstanceCount)).subscribe((instCnt) => {
      this.hapInstanceCnt = instCnt;
    });

    this.store.pipe(select(Selectors.selectAllInstances)).subscribe((instances) => {
      this.hapInstanceList = instances;
    });

  }
}
