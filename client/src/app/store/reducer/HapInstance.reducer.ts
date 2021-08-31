import { Action, createReducer, on } from '@ngrx/store';
import * as HapInstanceActionTypes from '../actions/HapInstance.action';
import { HapInstance } from '../models/HapInstance.model';

export interface HapInstanceState {
  list: HapInstance[];
  loading: boolean;
  error?: Error;
}
export const initialState: HapInstanceState = {
  list: [],
  loading: false,
  error: undefined,
};

const instanceLoadingReducer = createReducer(
  initialState,
  on(HapInstanceActionTypes.LoadHapInstanceAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapInstanceActionTypes.LoadHapInstanceSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload,
      loading: false,
    })
  ),
  on(
    HapInstanceActionTypes.LoadHapInstanceFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: HapInstanceState | undefined, action: Action) {
  return instanceLoadingReducer(state, action);
}
