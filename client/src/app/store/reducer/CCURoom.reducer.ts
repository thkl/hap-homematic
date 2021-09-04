import { Action, createReducer, on } from '@ngrx/store';
import * as CCURoomActionTypes from '../actions/CCURoom.action';
import { CCURoom } from '../models/CCURoom.model';

export interface CCURoomState {
  list: CCURoom[];
  loading: boolean;
  error?: Error;
}
export const initialState: CCURoomState = {
  list: [],
  loading: false,
  error: undefined,
};

const roomLoadingReducer = createReducer(
  initialState,
  on(CCURoomActionTypes.LoadCCURoomsAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    CCURoomActionTypes.LoadCCURoomsSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload,
      loading: false,
    })
  ),
  on(
    CCURoomActionTypes.LoadCCURoomsFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: CCURoomState | undefined, action: Action) {
  return roomLoadingReducer(state, action);
}
