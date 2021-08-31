import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { ApplicationService } from './application.service';

export interface Phrase {
    [key: string]: string;
}

@Injectable({
    providedIn: 'root'
})
export class LocalizationService {

    private phrases: Phrase = {};
    private api: string;
    private phrasesLoaded$: Observable<Phrase>;

    constructor(private http: HttpClient, private application: ApplicationService) {
        this.api = application.api;
        this.phrasesLoaded$ = new Observable<Phrase>();
        this.loadPhrases('de');
    }

    loadPhrases(lang: string): void {
        this.phrasesLoaded$ = this.http.get<Phrase>(`${this.api}/localizations/${lang}`);

        this.phrasesLoaded$.subscribe(newList => {
            this.phrases = newList;
        })

    }

    phrasesLoaded(): boolean {
        return Object.keys(this.phrases).length > 0;
    }

    subscribeToPhraseLoadStatus(): Observable<Phrase> {
        return this.phrasesLoaded$;
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
                var i = 0
                var output = msg
                if ((typeof msg) === 'string') {
                    output = msg.replace(/%s/g, (match, idx) => {
                        var subst = parameter.slice(i, ++i)
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
