import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { HapApplianceApiService } from 'src/app/service/hapappliance.service';
import { HapApplianceActionTypes } from '../actions';


@Injectable()
export class HapApplianceEffects {
  loadHapAppliances$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapApplianceActionTypes.LOAD_APPLIANCES),
      mergeMap(() =>
        this.hapApplianceService.loadHapAppliances().pipe(
          map((data: any) => {
            return {
              type: HapApplianceActionTypes.LOAD_APPLIANCES_SUCCESS,
              payload: data,
            };
          }),
          catchError((error) =>
            of({
              type: HapApplianceActionTypes.LOAD_APPLIANCES_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );


  saveHapAppliance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapApplianceActionTypes.SAVE_APPLIANCE_TO_API),
      switchMap((action) =>
        this.hapApplianceService.saveHapAppliance(action['payload']).pipe(
          map((data: any) => {
            return {
              type: HapApplianceActionTypes.SAVE_APPLIANCE_SUCCESS,
              payload: data.device,
            };
          }),
          catchError((error) =>
            of({
              type: HapApplianceActionTypes.SAVE_APPLIANCE_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private hapApplianceService: HapApplianceApiService
  ) { }
}
