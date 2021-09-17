import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { CCUObjectsActionTypes, LoadCCUDevicesFailureAction, LoadCCUDevicesSuccessAction, LoadCCUProgramsFailureAction, LoadCCUProgramsSuccessAction, LoadCCURoomsFailureAction, LoadCCURoomsSuccessAction, LoadCCUVariablesFailureAction, LoadCCUVariablesSuccessAction } from '../actions';


@Injectable()
export class CCUObjectEffects {

  loadCCUDevices$ = createEffect(() => this.actions$.pipe(
    ofType(CCUObjectsActionTypes.LOAD_CCU_DEVICES),
    mergeMap(() => this.systemconfigService.loadCompatibleCCUDevices()
      .pipe(
        map((data: any) => LoadCCUDevicesSuccessAction({ result: data })),
        catchError(error => of(LoadCCUDevicesFailureAction({ error: error })))
      )
    )
  )
  );

  loadRooms$ = createEffect(() => this.actions$.pipe(
    ofType(CCUObjectsActionTypes.LOAD_CCU_ROOMS),
    mergeMap(() => this.systemconfigService.loadRooms()
      .pipe(
        map((data: any) => LoadCCURoomsSuccessAction({ result: data })),
        catchError(error => of(LoadCCURoomsFailureAction({ error: error })))
      )
    )
  )
  );

  loadVariables$ = createEffect(() => this.actions$.pipe(
    ofType(CCUObjectsActionTypes.LOAD_CCU_VARIABLES),
    mergeMap(() => this.systemconfigService.loadCompatibleCCUVariables()
      .pipe(
        map((data: any) => LoadCCUVariablesSuccessAction({ result: data })),
        catchError(error => of(LoadCCUVariablesFailureAction({ error: error })))
      ))
  )
  );

  loadPrograms$ = createEffect(() => this.actions$.pipe(
    ofType(CCUObjectsActionTypes.LOAD_CCU_PROGRAMS),
    mergeMap(() => this.systemconfigService.loadCompatibleCCUPrograms()
      .pipe(
        map((data: any) => LoadCCUProgramsSuccessAction({ result: data })),
        catchError(error => of(LoadCCUProgramsFailureAction({ error: error })))
      ))
  )
  );

  constructor(
    private actions$: Actions,
    private systemconfigService: SystemconfigService
  ) { }
}
