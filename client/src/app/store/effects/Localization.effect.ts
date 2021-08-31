import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { LocalizationService } from 'src/app/service/localization.service';
import { LocalizationActionTypes } from '../actions';

@Injectable()
export class LocalizationEffects {
  loadLocalizations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocalizationActionTypes.LOAD),
      mergeMap(() =>
        this.localizationService.loadPhrases().pipe(
          map((data: any) => {
            return {
              type: LocalizationActionTypes.LOAD_SUCCESS,
              payload: data,
            };
          }),
          catchError((error) =>
            of({
              type: LocalizationActionTypes.LOAD_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private localizationService: LocalizationService
  ) { }
}
