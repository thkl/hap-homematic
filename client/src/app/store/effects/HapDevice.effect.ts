import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HapDevicesService } from 'src/app/service/hapdevices.service';
import { HapDeviceActionTypes } from '../actions/HapDevice.action';

@Injectable()
export class HapDeviceEffects {
  loadHapDevices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HapDeviceActionTypes.LOAD_DEVICE),
      mergeMap(() =>
        this.hapDevicesService.loadHapDevices().pipe(
          map((data: any) => {
            return {
              type: HapDeviceActionTypes.LOAD_DEVICE_SUCCESS,
              payload: data.devices,
            };
          }),
          catchError((error) =>
            of({
              type: HapDeviceActionTypes.LOAD_DEVICE_FAILED,
              payload: error,
            })
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private hapDevicesService: HapDevicesService
  ) { }
}
