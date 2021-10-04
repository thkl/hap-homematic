import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';

@Component({
  selector: 'app-header-instancelist',
  templateUrl: './instancelist.component.html',
  styleUrls: ['./instancelist.component.sass'],
})
export class InstancelistHeaderComponent extends AbstractDataComponent implements OnInit {
  public hapInstanceList: Models.HapInstance[];
  public hapInstanceCnt: number;

  constructor(private store: Store<Models.AppState>) {
    super();
  }

  ngOnInit(): void {

    this.addSubscription(
      this.store.pipe(select(Selectors.selectInstanceCount))
        .subscribe((instCnt) => {
          this.hapInstanceCnt = instCnt;
        })
    );

    this.addSubscription(
      this.store.pipe(select(Selectors.selectAllInstances))
        .subscribe((instances) => {
          this.hapInstanceList = instances;
        })
    );
  }

}
