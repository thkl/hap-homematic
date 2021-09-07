import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HapApplianceApiService } from 'src/app/service/hapappliance.service';
import { CCUDeviceActionTypes } from '../actions';


@Injectable()
export class CCUDevicesEffects {

  loadCCUDevices$ = createEffect(() => this.actions$.pipe(
    ofType(CCUDeviceActionTypes.LOAD_CCUDEVICES),
    mergeMap(() => this.applianceService.loadCompatibleCCUDevices()
      .pipe(
        map((data: any) => ({ type: CCUDeviceActionTypes.LOAD_CCUDEVICES_SUCCESS, payload: data.devices })),
        catchError(error => of({ type: CCUDeviceActionTypes.LOAD_CCUDEVICES_FAILED, payload: error }))
      ))
  )
  );

  constructor(
    private actions$: Actions,
    private applianceService: HapApplianceApiService
  ) { }
}
