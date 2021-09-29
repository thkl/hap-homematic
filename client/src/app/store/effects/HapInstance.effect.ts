import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
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

  saveHapInstance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapInstanceActionTypes.SAVE_INSTANCE_TO_API),
      switchMap((action) =>
        this.hapInstanceService.saveHapInstance(action['payload']).pipe(
          map((data: any) => {
            return {
              type: HapInstanceActionTypes.SAVE_INSTANCE_TO_API_SUCCESS,
              payload: data,
            };
          }),
          catchError((error) =>
            of({
              type: HapInstanceActionTypes.SAVE_INSTANCE_TO_API_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  createHapInstances$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapInstanceActionTypes.CREATE_INSTANCE_AT_API),
      switchMap((action) =>
        this.hapInstanceService.createHapInstance(action['payload']).pipe(
          map((data: any) => {
            return {
              type: HapInstanceActionTypes.SAVE_INSTANCE_TO_API_SUCCESS,
              payload: data,
            };
          }),
          catchError((error) =>
            of({
              type: HapInstanceActionTypes.SAVE_INSTANCE_TO_API_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  deleteHapInstance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapInstanceActionTypes.DELETE_INSTANCE_FROM_API),
      switchMap((action) =>
        this.hapInstanceService.deleteHapInstance(action['payload']).pipe(
          map((data: any) => {
            return {
              type: HapInstanceActionTypes.DELETE_INSTANCE_FROM_API_SUCCESS,
              payload: data,
            };
          }),
          catchError((error) =>
            of({
              type: HapInstanceActionTypes.DELETE_INSTANCE_FROM_API_FAILED,
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
