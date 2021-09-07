import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Models, Actions } from 'src/app/store';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.sass']
})
export class ShellComponent implements OnInit {

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {

    this.store.dispatch({ type: Actions.HapInstanceActionTypes.LOAD_INSTANCES });
    this.store.dispatch({ type: Actions.HapApplianceActionTypes.LOAD_APPLIANCES });
    this.store.dispatch({ type: Actions.CCURoomActionTypes.LOAD_ROOMS });
    this.store.dispatch({ type: Actions.CCUDeviceActionTypes.LOAD_CCUDEVICES });
  }

}
