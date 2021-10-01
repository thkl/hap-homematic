import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map, switchAll } from 'rxjs/operators';
import { Actions, Models, Selectors } from '../store';
import { LocalizationPhrase } from '../store/models';
import { ApplicationService } from './application.service';


@Injectable({
  providedIn: 'root'
})
export class LocalizationService {

  private phrases: LocalizationPhrase = {};
  private api: string;

  constructor(private http: HttpClient, private store: Store<Models.AppState>, private application: ApplicationService) {
    this.api = application.api;

    this.store.pipe(select(Selectors.localizationData)).subscribe((phrases) => {
      this.phrases = phrases;
    });
  }

  subscribeToPhraseLoadStatus() {
    return this.store.pipe(select(Selectors.localizationData));
  }

  loadPhrases() {
    const lang = this.application.language;
    return this.http.get<LocalizationPhrase>(`${this.api}/localizations/${lang}`, { headers: this.application.httpHeaders() });
  }

  phrasesLoaded(): boolean {
    return Object.keys(this.phrases).length > 0;
  }

  l18n(msg: string, parameter?: any[]): string {
    if (this.phrases) {
      if ((this.phrases[msg] === undefined) && (msg !== undefined) && (msg !== '')) {
        console.warn('No translation for ' + msg)
      }

      msg = this.phrases[msg] || msg
    }

    if (parameter !== undefined) {

      if (parameter.length > 0) {
        let i = 0
        let output = msg
        if ((typeof msg) === 'string') {
          output = msg.replace(/%s/g, (match, idx) => {
            const subst = parameter.slice(i, ++i)
            return subst.toString()
          })
        }
        return output
      } else {
        return msg
      }
    } return msg;
  }
}
