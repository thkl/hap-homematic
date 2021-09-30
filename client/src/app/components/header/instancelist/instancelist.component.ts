import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-header-instancelist',
  templateUrl: './instancelist.component.html',
  styleUrls: ['./instancelist.component.sass'],
})
export class InstancelistHeaderComponent implements OnInit, OnDestroy {
  public hapInstanceList: Models.HapInstance[];
  public hapInstanceCnt: number;
  private ngDestroyed$ = new Subject();

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.selectInstanceCount))
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe((instCnt) => {
        this.hapInstanceCnt = instCnt;
      });

    this.store.pipe(select(Selectors.selectAllInstances))
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe((instances) => {
        this.hapInstanceList = instances;
      });
  }

  ngOnDestroy() {
    this.ngDestroyed$.next();
  }
}
