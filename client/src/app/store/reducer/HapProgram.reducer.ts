import { Action, createReducer, on } from '@ngrx/store';
import * as HapProgramActionTypes from '../actions/HapProgram.action';
import { HapAppliance } from '../models/HapAppliance.model';

export interface HapProgramState {
  list: HapAppliance[];
  loading: boolean;
  error?: Error;
}
export const initialState: HapProgramState = {
  list: [],
  loading: false,
  error: undefined,
};

const programLoadingReducer = createReducer(
  initialState,
  on(HapProgramActionTypes.LoadHapProgramsAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapProgramActionTypes.LoadHapProgramsSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload,
      loading: false,
    })
  ),
  on(
    HapProgramActionTypes.LoadHapProgramsFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: HapProgramState | undefined, action: Action) {
  return programLoadingReducer(state, action);
}
