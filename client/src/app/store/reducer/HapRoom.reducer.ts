import { Action, createReducer, on } from '@ngrx/store';
import * as HapRoomActionTypes from '../actions/HapRoom.action';
import { HapAppliance } from '../models/HapAppliance.model';
import { HapRoom } from '../models/HapRoom.model';

export interface HapRoomState {
  list: HapRoom[];
  loading: boolean;
  error?: Error;
}
export const initialState: HapRoomState = {
  list: [],
  loading: false,
  error: undefined,
};

const roomLoadingReducer = createReducer(
  initialState,
  on(HapRoomActionTypes.LoadHapRoomsAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapRoomActionTypes.LoadHapRoomsSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload,
      loading: false,
    })
  ),
  on(
    HapRoomActionTypes.LoadHapRoomsFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: HapRoomState | undefined, action: Action) {
  return roomLoadingReducer(state, action);
}
