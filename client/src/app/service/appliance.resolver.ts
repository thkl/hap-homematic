import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { Models, Selectors } from "../store";

@Injectable()
export class ApplicanceListResolver implements Resolve<any> {

  loaded = false;

  constructor(private store: Store<Models.AppState>) {
    this.store.pipe(select(Selectors.devicesLoaded)).subscribe(loaded => {
      this.loaded = loaded;
    })
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.loaded;
  }
}
