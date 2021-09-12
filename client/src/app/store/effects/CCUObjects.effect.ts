import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { CCUDeviceActionTypes, CCURoomActionTypes } from '../actions';
import { CCUVariableActionTypes } from '../actions/CCUVariable.action';


@Injectable()
export class CCUObjectEffects {

  loadCCUDevices$ = createEffect(() => this.actions$.pipe(
    ofType(CCUDeviceActionTypes.LOAD_CCUDEVICES),
    mergeMap(() => this.systemconfigService.loadCompatibleCCUDevices()
      .pipe(
        map((data: any) => ({ type: CCUDeviceActionTypes.LOAD_CCUDEVICES_SUCCESS, payload: data })),
        catchError(error => of({ type: CCUDeviceActionTypes.LOAD_CCUDEVICES_FAILED, payload: error }))
      ))
  )
  );

  loadRooms$ = createEffect(() => this.actions$.pipe(
    ofType(CCURoomActionTypes.LOAD_ROOMS),
    mergeMap(() => this.systemconfigService.loadRooms()
      .pipe(
        map((data: any) => ({ type: CCURoomActionTypes.LOAD_ROOMS_SUCCESS, payload: data })),
        catchError(error => of({ type: CCURoomActionTypes.LOAD_ROOMS_FAILED, payload: error }))
      ))
  )
  );

  loadVariables$ = createEffect(() => this.actions$.pipe(
    ofType(CCUVariableActionTypes.LOAD_CCUVARIABLES),
    mergeMap(() => this.systemconfigService.loadCompatibleCCUVariables()
      .pipe(
        map((data: any) => ({ type: CCUVariableActionTypes.LOAD_CCUVARIABLES_SUCCESS, payload: data })),
        catchError(error => of({ type: CCUVariableActionTypes.LOAD_CCUVARIABLES_FAILED, payload: error }))
      ))
  )
  );

  constructor(
    private actions$: Actions,
    private systemconfigService: SystemconfigService
  ) { }
}
