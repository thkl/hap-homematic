import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, pipe } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { HapRoomActionTypes } from '../actions';

@Injectable()
export class HapRoomEffects {

  loadRooms$ = createEffect(() => this.actions$.pipe(
    ofType(HapRoomActionTypes.LOAD_ROOMS),
    mergeMap(() => this.systemconfigService.loadRooms()
      .pipe(
        map((data: any) => ({ type: HapRoomActionTypes.LOAD_ROOMS_SUCCESS, payload: data.rooms })),
        catchError(error => of({ type: HapRoomActionTypes.LOAD_ROOMS_FAILED, payload: error }))
      ))
  )
  );

  constructor(
    private actions$: Actions,
    private systemconfigService: SystemconfigService
  ) { }
}
