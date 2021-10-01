import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import * as HapActions from '../actions';

@Injectable()
export class SystemConfigEffects {

  loadSystemConfig$ = createEffect(() => this.actions$.pipe(
    ofType(HapActions.SystemConfigActionTypes.LOAD_CONFIG),
    mergeMap(() => this.systemconfigService.loadSystemConfiguration()
      .pipe(
        map(data => { return HapActions.LoadSystemConfigSuccessAction({ systemConfig: data }) }),
        catchError(error => of(HapActions.LoadSystemConfigFailureAction({ error: error }))
        )
      ))
  ));

  saveSystemConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapActions.SystemConfigActionTypes.SAVE_CONFIG),
      switchMap((action) => this.systemconfigService.saveConfig(action['systemconfig']).pipe(
        map((data: any) => {
          return HapActions.SaveSystemConfigSuccessAction({ systemConfig: data })
        }),
        catchError((error) =>
          of(HapActions.SaveSystemConfigFailureAction({ error: error }))
        )
      ))
    ));

  constructor(
    private actions$: Actions,
    private systemconfigService: SystemconfigService
  ) { }
}
