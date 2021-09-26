import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { SystemConfigActionTypes } from '../actions';
import { SystemLoggingActionTypes } from '../actions/SystemLogging.action';

@Injectable()
export class SystemLoggingDataEffects {

  loadLoggingData$ = createEffect(() => this.actions$.pipe(
    ofType(SystemLoggingActionTypes.LOAD_LOGFILE),
    mergeMap(() => this.systemconfigService.getLogFile()
      .pipe(
        map(data => ({ type: SystemLoggingActionTypes.LOAD_LOGFILE_SUCCESS, result: data })),
        catchError(error => of({ type: SystemLoggingActionTypes.LOAD_LOGFILE_FAILED, payload: error }))
      ))
  )
  );


  loadCrashList$ = createEffect(() => this.actions$.pipe(
    ofType(SystemLoggingActionTypes.LOAD_CRASHLIST),
    mergeMap(() => this.systemconfigService.getCrashes()
      .pipe(
        map(data => ({ type: SystemLoggingActionTypes.LOAD_CRASHLIST_SUCCESS, crashlist: data })),
        catchError(error => of({ type: SystemLoggingActionTypes.LOAD_CRASHLIST_FAILED, payload: error }))
      ))
  )
  );


  loadCrashDetail$ = createEffect(() => this.actions$.pipe(
    ofType(SystemLoggingActionTypes.LOAD_CRASH),
    mergeMap((action) => this.systemconfigService.getCrashDetail(action['timestamp'])
      .pipe(
        map(data => ({ type: SystemLoggingActionTypes.LOAD_CRASH_SUCCESS, crashdetail: data })),
        catchError(error => of({ type: SystemLoggingActionTypes.LOAD_CRASH_FAILED, payload: error }))
      ))
  )
  );

  deleteCrash$ = createEffect(() => this.actions$.pipe(
    ofType(SystemLoggingActionTypes.DELETE_CRASH),
    mergeMap((action) => this.systemconfigService.deleteCrash(action['timestamp'])
      .pipe(
        map(data => ({ type: SystemLoggingActionTypes.DELETE_CRASH_SUCCESS, crashlist: data })),
        catchError(error => of({ type: SystemLoggingActionTypes.DELETE_CRASH_FAILED, payload: error }))
      ))
  )
  );

  toggleDebug$ = createEffect(() => this.actions$.pipe(
    ofType(SystemLoggingActionTypes.SWITCH_DEBUG),
    mergeMap((action) => this.systemconfigService.toggleDebug(action['enable'])
      .pipe(
        map(data => ({ type: SystemConfigActionTypes.LOAD_CONFIG_SUCCESS, systemConfig: data })),
        catchError(error => of({ type: SystemLoggingActionTypes.SWITCH_DEBUG_FAILED, payload: error }))
      ))
  )
  );




  constructor(
    private actions$: Actions,
    private systemconfigService: SystemconfigService
  ) { }
}
