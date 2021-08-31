import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HapVariableService } from 'src/app/service/hapvariable.service';
import { HapVariableActionTypes } from '../actions/HapVariable.action';

@Injectable()
export class HapVariableEffects {
  loadHapVariables$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapVariableActionTypes.LOAD_VARIABLE),
      mergeMap(() =>
        this.hapVariableService.loadHapVariables().pipe(
          map((data: any) => {
            return {
              type: HapVariableActionTypes.LOAD_VARIABLE_SUCCESS,
              list: data.variables,
              trigger: data.trigger,
            };
          }),
          catchError((error) =>
            of({
              type: HapVariableActionTypes.LOAD_VARIABLE_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private hapVariableService: HapVariableService
  ) {}
}
