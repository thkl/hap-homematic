import { createAction, props } from '@ngrx/store';
import { HapRoom } from '../models/HapRoom.model';

export enum HapRoomActionTypes {
  LOAD_ROOMS = '[HAP Room] Load List',
  LOAD_ROOMS_SUCCESS = '[HAP Room] Load List Success',
  LOAD_ROOMS_FAILED = '[HAP Room] Load List Failed'
}

export const LoadHapRoomsAction = createAction(
  HapRoomActionTypes.LOAD_ROOMS
);
export const LoadHapRoomsSuccessAction = createAction(
  HapRoomActionTypes.LOAD_ROOMS_SUCCESS,
  props<{ payload: HapRoom[] }>()
);
export const LoadHapRoomsFailureAction = createAction(
  HapRoomActionTypes.LOAD_ROOMS_FAILED,
  props<{ payload: Error }>()
);
