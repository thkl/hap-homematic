import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';
import *  as Utility from 'src/app/service/utility';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-systemstate',
  templateUrl: './systemstate.component.html',
  styleUrls: ['./systemstate.component.sass']
})
export class SystemstateComponent extends AbstractDataComponent implements OnInit {

  public systemState: Models.SystemConfig = {};

  constructor(
    private store: Store<Models.AppState>,
    private router: Router) {
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


  isNewerVersion(oldVer: string, newVer: string): boolean {
    return Utility.isNewerVersion(oldVer, newVer);
  }

  gotoChangeLog(): void {
    this.router.navigate(['/changelog']);
  }
}
