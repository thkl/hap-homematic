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

    this.store.dispatch({ type: Actions.HapProgramActionTypes.LOAD_PROGRAM });
    this.store.dispatch({ type: Actions.HapDeviceActionTypes.LOAD_DEVICE });
    this.store.dispatch({ type: Actions.HapVariableActionTypes.LOAD_VARIABLE });
    this.store.dispatch({ type: Actions.HapInstanceActionTypes.LOAD_INSTANCES });
    this.store.dispatch({ type: Actions.HapSpecialDevicesActionTypes.LOAD_DEVICE });

  }

}
