import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { HapApplianceApiService } from 'src/app/service/hapappliance.service';
import { Models, Selectors } from '..';
import * as HapActions from '../actions';
import { HapAppliance } from '../models';


@Injectable()
export class HapApplianceEffects {
  loadHapAppliances$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapActions.HapApplianceActionTypes.LOAD_APPLIANCES),
      mergeMap(() =>
        this.hapApplianceService.loadHapAppliances().pipe(
          map((data: any) => {
            return HapActions.LoadHapAppliancesSuccessAction({ loadingResult: data });
          }),
          catchError((error) =>
            of(HapActions.LoadHapAppliancesFailureAction({ error: error }))
          )
        )
      )
    )
  );


  saveHapAppliance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapActions.HapApplianceActionTypes.SAVE_APPLIANCE_TO_API),
      switchMap((action) =>
        this.hapApplianceService.saveHapAppliances(action['payload']).pipe(
          map((data: any) => {
            return HapActions.SaveHapApplianceToApiActionSuccess({ result: data });
          }),
          catchError((error) =>
            of(HapActions.SaveHapApplianceToApiFailureAction({ error: error }))
          )
        )
      )
    )
  );

  editHapAppliance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapActions.HapApplianceActionTypes.EDIT_APPLIANCE),
      switchMap((action) =>
        this.store.select(Selectors.selectApplianceByAddress(action['payload'])).pipe(
          map((appliance: HapAppliance) => {
            return HapActions.AddHapApplianceAction({ appliance: appliance })
          })
        )
      )
    )
  );

  deleteHapAppliance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapActions.HapApplianceActionTypes.DELETE_APPLIANCE_FROM_API),
      switchMap((action) =>
        this.hapApplianceService.deleteHapAppliance(action['applianceToDelete']).pipe(
          map((data: any) => {
            return HapActions.DeleteHapApplianceFromApiActionSuccess({ result: data })
          }),
          catchError((error) =>
            of(HapActions.DeleteHapApplianceFromApiFailureAction({ error: error }))
          )
        )
      )
    )
  );

  saveVariableTrigger$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapActions.HapApplianceActionTypes.SAVE_VARTRIGGER_TO_API),
      switchMap((action) =>
        this.hapApplianceService.saveVariableTrigger(action['datapoint'], action['createhelper']).pipe(
          map((data: any) => {
            return HapActions.SaveVariableTriggerToApiActionSuccess({ result: data });
          }),
          catchError((error) =>
            of(HapActions.SaveVariableTriggerToApiFailureAction({ error: error }))
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
