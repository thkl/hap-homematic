import { Action, createReducer, on } from '@ngrx/store';
import * as CCUVariableActionTypes from '../actions/CCUVariable.action';
import { CCUVariable } from '../models/CCUObjects.model';

export interface CCUVariableState {
  list: CCUVariable[];
  loading: boolean;
  error?: Error;
}
export const initialState: CCUVariableState = {
  list: [],
  loading: false,
  error: undefined,
};

const ccuVariableLoadingReducer = createReducer(
  initialState,
  on(CCUVariableActionTypes.LoadCCUVariablesAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    CCUVariableActionTypes.LoadCCUVariablesSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload.variables,
      loading: false,
    })
  ),
  on(
    CCUVariableActionTypes.LoadCCUVariablesFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: CCUVariableState | undefined, action: Action) {
  return ccuVariableLoadingReducer(state, action);
}
