import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { Models, Selectors } from "../store";
import { LocalizationPhrase } from "../store/models";
import { LocalizationService } from "./localization.service";

@Injectable()
export class LocalizationResolver implements Resolve<any> {

  constructor(private localizationService: LocalizationService, private store: Store<Models.AppState>) {

  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> | boolean {
    if (this.localizationService.phrasesLoaded() === true) {
      return true;
    } else { // What a mess
      return new Promise(resolve => {
        this.store.pipe(select(Selectors.localizationLoaded)).subscribe((phl) => {
          if (phl === true) { resolve(true) };
        })
      })
    }
  }
}
