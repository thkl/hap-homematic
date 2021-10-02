import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { select, Store } from "@ngrx/store";
import { Models, Selectors } from "../store";
import { ApplicationService } from "./application.service";

@Injectable()
export class ConfigResolver implements Resolve<any> {

  constructor(
    private applicationService: ApplicationService,
    private store: Store<Models.AppState>
  ) {

  }

  /* the config resolver lets every route wait until config was loaded.
  we will need this for authentication
  */

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> | boolean {
    if (this.applicationService.configLoaded === true) {
      return true;
    } else { // What a mess
      return new Promise(resolve => {
        this.store.pipe(select(Selectors.configLoaded)).subscribe((phl) => {
          if (phl === true) { resolve(true) }
        })
      })
    }
  }
}
