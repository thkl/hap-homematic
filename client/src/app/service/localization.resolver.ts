import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { LocalizationService, Phrase } from "./localization.service";

@Injectable()
export class LocalizationResolver implements Resolve<any> {

    constructor(private localizationService: LocalizationService) {

    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Phrase> | boolean {
        if (this.localizationService.phrasesLoaded() === true) {
            return true;
        } else {
            return this.localizationService.subscribeToPhraseLoadStatus();
        }
    }
}