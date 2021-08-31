import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HapSpecialDevicesService } from 'src/app/service/hapspecialdevices.service';
import { HapSpecialDevicesActionTypes } from '../actions';

@Injectable()
export class HapSpecialDeviceEffects {
  loadHapDevices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapSpecialDevicesActionTypes.LOAD_DEVICE),
      mergeMap(() =>
        this.hapSpecialDevicesService.loadHapSpecialDevices().pipe(
          map((data: any) => {
            return {
              type: HapSpecialDevicesActionTypes.LOAD_DEVICE_SUCCESS,
              payload: data.special,
            };
          }),
          catchError((error) =>
            of({
              type: HapSpecialDevicesActionTypes.LOAD_DEVICE_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private hapSpecialDevicesService: HapSpecialDevicesService
  ) { }
}
