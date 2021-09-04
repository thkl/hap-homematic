import { createAction, props } from '@ngrx/store';
import { CCURoom } from '../models/CCURoom.model';

export enum CCURoomActionTypes {
  LOAD_ROOMS = '[CCU Room] Load List',
  LOAD_ROOMS_SUCCESS = '[CCU Room] Load List Success',
  LOAD_ROOMS_FAILED = '[CCU Room] Load List Failed'
}

export const LoadCCURoomsAction = createAction(
  CCURoomActionTypes.LOAD_ROOMS
);
export const LoadCCURoomsSuccessAction = createAction(
  CCURoomActionTypes.LOAD_ROOMS_SUCCESS,
  props<{ payload: CCURoom[] }>()
);
export const LoadCCURoomsFailureAction = createAction(
  CCURoomActionTypes.LOAD_ROOMS_FAILED,
  props<{ payload: Error }>()
);
