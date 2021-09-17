import { Action, createReducer, on } from '@ngrx/store';
import * as CCURoomActionTypes from '../actions/CCUObjects.action';
import { CCURoom } from '../models/CCUObjects.model';

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
    (state, { result }) => ({
      ...state,
      list: result.rooms,
      loading: false,
    })
  ),
  on(
    CCURoomActionTypes.LoadCCURoomsFailureAction,
    (state, { error }) => ({
      ...state,
      error: error,
      loading: false,
    })
  )
);

export function reducer(state: CCURoomState | undefined, action: Action) {
  return roomLoadingReducer(state, action);
}
