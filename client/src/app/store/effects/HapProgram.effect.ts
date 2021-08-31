import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HapProgramsService } from 'src/app/service/happrograms.service';
import { HapProgramActionTypes } from '../actions/HapProgram.action';

@Injectable()
export class HapProgramEffects {
  loadHapPrograms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapProgramActionTypes.LOAD_PROGRAM),
      mergeMap(() =>
        this.hapProgramsService.loadHapPrograms().pipe(
          map((data: any) => {
            return {
              type: HapProgramActionTypes.LOAD_PROGRAM_SUCCESS,
              payload: data.programs,
            };
          }),
          catchError((error) =>
            of({
              type: HapProgramActionTypes.LOAD_PROGRAM_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private hapProgramsService: HapProgramsService
  ) { }
}
