import { Action, createReducer, on } from '@ngrx/store';
import * as CCUVariableActionTypes from '../actions/CCUObjects.action';
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
    (state, { result }) => ({
      ...state,
      list: result.variables,
      loading: false,
    })
  ),
  on(
    CCUVariableActionTypes.LoadCCUVariablesFailureAction,
    (state, { error }) => ({
      ...state,
      error: error,
      loading: false,
    })
  )
);

export function reducer(state: CCUVariableState | undefined, action: Action) {
  return ccuVariableLoadingReducer(state, action);
}
