import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-header-systemstate',
  templateUrl: './systemstate.component.html',
  styleUrls: ['./systemstate.component.sass']
})
export class SystemstateComponent implements OnInit, OnDestroy {

  public systemState: Models.SystemConfig = {};
  private ngDestroyed$ = new Subject();

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.configData))
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe((newConfig) => {
        if (newConfig) {
          this.systemState = newConfig;
        }
      })

  }

  ngOnDestroy() {
    this.ngDestroyed$.next();
  }
}
