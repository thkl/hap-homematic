import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { SystemConfigActionTypes } from '../actions/SystemConfig.action';

@Injectable()
export class SystemConfigEffects {

  loadSystemConfig$ = createEffect(() => this.actions$.pipe(
    ofType(SystemConfigActionTypes.LOAD_CONFIG),
    mergeMap(() => this.systemconfigService.loadSystemConfiguration()
      .pipe(
        map(data => ({ type: SystemConfigActionTypes.LOAD_CONFIG_SUCCESS, systemConfig: data })),
        catchError(error => of({ type: SystemConfigActionTypes.LOAD_CONFIG_FAILED, payload: error }))
      ))
  )
  );

  constructor(
    private actions$: Actions,
    private systemconfigService: SystemconfigService
  ) { }
}
