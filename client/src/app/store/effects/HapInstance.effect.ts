import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HapinstanceService } from 'src/app/service/hapinstance.service';
import { HapInstanceActionTypes } from '../actions/HapInstance.action';

@Injectable()
export class HapInstanceEffects {
  loadHapInstances$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapInstanceActionTypes.LOAD_INSTANCES),
      mergeMap(() =>
        this.hapInstanceService.loadHapInstances().pipe(
          map((data: any) => {
            return {
              type: HapInstanceActionTypes.LOAD_INSTANCES_SUCCESS,
              payload: data.instances,
            };
          }),
          catchError((error) =>
            of({
              type: HapInstanceActionTypes.LOAD_INSTANCES_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private hapInstanceService: HapinstanceService
  ) { }
}
