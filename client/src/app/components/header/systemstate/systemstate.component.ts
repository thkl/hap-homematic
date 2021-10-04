import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';

@Component({
  selector: 'app-header-systemstate',
  templateUrl: './systemstate.component.html',
  styleUrls: ['./systemstate.component.sass']
})
export class SystemstateComponent extends AbstractDataComponent implements OnInit {

  public systemState: Models.SystemConfig = {};

  constructor(private store: Store<Models.AppState>) {
    super();
  }

  ngOnInit(): void {
    this.addSubscription(
      this.store.pipe(select(Selectors.configData))
        .subscribe((newConfig) => {
          if (newConfig) {
            this.systemState = newConfig;
          }
        })
    );
  }
}
