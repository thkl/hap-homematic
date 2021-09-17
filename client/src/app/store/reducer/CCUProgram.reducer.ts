import { Action, createReducer, on } from '@ngrx/store';
import * as CCUProgramActionTypes from '../actions/CCUObjects.action';
import { CCUProgram } from '../models/CCUObjects.model';

export interface CCUProgramState {
  list: CCUProgram[];
  loading: boolean;
  error?: Error;
}
export const initialState: CCUProgramState = {
  list: [],
  loading: false,
  error: undefined,
};

const ccuProgramLoadingReducer = createReducer(
  initialState,
  on(CCUProgramActionTypes.LoadCCUProgramsAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    CCUProgramActionTypes.LoadCCUProgramsSuccessAction,
    (state, { result }) => ({
      ...state,
      list: result.programs,
      loading: false,
    })
  ),
  on(
    CCUProgramActionTypes.LoadCCUProgramsFailureAction,
    (state, { error }) => ({
      ...state,
      error: error,
      loading: false,
    })
  )
);

export function reducer(state: CCUProgramState | undefined, action: Action) {
  return ccuProgramLoadingReducer(state, action);
}
