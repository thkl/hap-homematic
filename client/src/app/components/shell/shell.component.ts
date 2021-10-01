import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AccountService } from 'src/app/service/account.service';
import { Models, Actions } from 'src/app/store';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.sass']
})
export class ShellComponent implements OnInit {

  isLoggedIn: boolean;
  wasLoggedIn: boolean;

  constructor(
    private store: Store<Models.AppState>,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {

    this.accountService.subscribe().subscribe(isLogin => {
      this.isLoggedIn = isLogin;
      if ((isLogin) && (!this.wasLoggedIn)) {
        this.store.dispatch(Actions.LoadHapInstanceAction());
        this.store.dispatch(Actions.LoadHapAppliancesAction());
        this.store.dispatch(Actions.LoadCCURoomsAction());
        this.store.dispatch(Actions.LoadCCUDevicesAction());
        this.store.dispatch(Actions.LoadCCUVariablesAction());
        this.store.dispatch(Actions.LoadCCUProgramsAction());
      }
      this.wasLoggedIn = this.isLoggedIn;

    })
  }

}
