import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { HapApplianceApiService } from 'src/app/service/hapappliance.service';
import { Models, Selectors } from '..';
import { HapApplianceActionTypes, LoadHapAppliancesSuccessAction, SaveHapApplianceToApiActionSuccess, SaveHapApplianceToApiFailureAction } from '../actions';
import { HapAppliance } from '../models';


@Injectable()
export class HapApplianceEffects {
  loadHapAppliances$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapApplianceActionTypes.LOAD_APPLIANCES),
      mergeMap(() =>
        this.hapApplianceService.loadHapAppliances().pipe(
          map((data: any) => {
            return LoadHapAppliancesSuccessAction({ loadingResult: data });
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
        this.hapApplianceService.saveHapAppliances(action['payload']).pipe(
          map((data: any) => {
            return SaveHapApplianceToApiActionSuccess({ result: data });
          }),
          catchError((error) =>
            of(SaveHapApplianceToApiFailureAction({ error: error }))
          )
        )
      )
    )
  );

  editHapAppliance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapApplianceActionTypes.EDIT_APPLIANCE),
      switchMap((action) =>
        this.store.select(Selectors.selectApplianceByAddress(action['payload'])).pipe(
          map((appl: HapAppliance) => {
            return {
              type: HapApplianceActionTypes.ADD_APPLIANCE,
              payload: appl,
            }
          }
          )
        )
      )
    )
  );

  deleteHapAppliance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapApplianceActionTypes.DELETE_APPLIANCE_FROM_API),
      switchMap((action) =>
        this.hapApplianceService.deleteHapAppliance(action['applianceToDelete']).pipe(
          map((data: any) => {
            return {
              type: HapApplianceActionTypes.DELETE_APPLIANCE_FROM_API_SUCCESS,
              payload: data,
            };
          }),
          catchError((error) =>
            of({
              type: HapApplianceActionTypes.DELETE_APPLIANCE_FROM_API_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    public store: Store<Models.AppState>,
    private hapApplianceService: HapApplianceApiService
  ) { }
}
