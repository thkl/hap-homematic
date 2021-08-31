import { Action, createReducer, on } from '@ngrx/store';
import * as HapVariableActionTypes from '../actions/HapVariable.action';
import { HapAppliance } from '../models/HapAppliance.model';

export interface HapVariableState {
  list: HapAppliance[];
  trigger: string;
  loading: boolean;
  error?: Error;
}
export const initialState: HapVariableState = {
  list: [],
  trigger: '',
  loading: false,
  error: undefined,
};

const variablesLoadingReducer = createReducer(
  initialState,
  on(HapVariableActionTypes.LoadHapVariablesAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapVariableActionTypes.LoadHapVariablesSuccessAction,
    (state, { list, trigger }) => ({
      ...state,
      list: list,
      trigger: trigger,
      loading: false,
    })
  ),
  on(
    HapVariableActionTypes.LoadHapVariablesFailureAction,
    (state, { error }) => ({
      ...state,
      error: error,
      loading: false,
    })
  )
);

export function reducer(state: HapVariableState | undefined, action: Action) {
  return variablesLoadingReducer(state, action);
}
