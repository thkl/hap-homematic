import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { HapDeviceActionTypes } from 'src/app/store/actions/HapDevice.action';
import { HapInstanceActionTypes } from 'src/app/store/actions/HapInstance.action';
import { HapProgramActionTypes } from 'src/app/store/actions/HapProgram.action';
import { HapVariableActionTypes } from 'src/app/store/actions/HapVariable.action';
import { AppState } from 'src/app/store/models/app-state.model';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.sass']
})
export class ShellComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  ngOnInit(): void {
    this.store.dispatch({ type: HapProgramActionTypes.LOAD_PROGRAM });
    this.store.dispatch({ type: HapDeviceActionTypes.LOAD_DEVICE });
    this.store.dispatch({ type: HapVariableActionTypes.LOAD_VARIABLE });
    this.store.dispatch({ type: HapInstanceActionTypes.LOAD_INSTANCES });
  }

}
