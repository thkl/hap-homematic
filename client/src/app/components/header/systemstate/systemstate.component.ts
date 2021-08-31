import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Actions, Models, Selectors } from 'src/app/store';

@Component({
  selector: 'app-header-systemstate',
  templateUrl: './systemstate.component.html',
  styleUrls: ['./systemstate.component.sass']
})
export class SystemstateComponent implements OnInit {

  public systemState: Models.SystemConfig = {};

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.store.pipe(select(Selectors.configData)).subscribe((newConfig) => {
      console.log(newConfig)
      if (newConfig) {
        this.systemState = newConfig;
      }
    })

    this.store.dispatch({ type: Actions.SystemConfigActionTypes.LOAD_CONFIG });
  }

}
