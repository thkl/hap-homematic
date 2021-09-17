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

    this.store.dispatch(Actions.LoadHapInstanceAction());
    this.store.dispatch(Actions.LoadHapAppliancesAction());
    this.store.dispatch(Actions.LoadCCURoomsAction());
    this.store.dispatch(Actions.LoadCCUDevicesAction());
    this.store.dispatch(Actions.LoadCCUVariablesAction());
  }

}
