import { Action, createReducer, on } from '@ngrx/store';
import * as SystemLoggingActionTypes from '../actions/SystemLogging.action';

export interface SystemLoggingState {
  loggingData: string,
  crashes: string[],
  crashDetail: string,
  loading: boolean,
  error?: Error
}
export const initialState: SystemLoggingState = {
  loggingData: '{}',
  crashes: [],
  loading: false,
  crashDetail: '',
  error: undefined
};


const configLoadingReducer = createReducer(
  initialState,
  on(SystemLoggingActionTypes.LoadSystemLogfileAction, state => ({
    ...state, loading: true
  })),

  on(SystemLoggingActionTypes.LoadSystemLogfileSuccessAction, (state, { result }) => ({
    ...state, loggingData: result, loading: false
  })),

  on(SystemLoggingActionTypes.LoadSystemLogfileFailureAction, (state, { error }) => ({
    ...state, error: error, loading: false
  })),

  on(SystemLoggingActionTypes.LoadCrashlistAction, state => ({
    ...state, loading: true
  })),

  on(SystemLoggingActionTypes.LoadCrashlistSuccessAction, (state, { crashlist }) => ({
    ...state, crashes: crashlist, loading: false
  })),

  on(SystemLoggingActionTypes.LoadCrashlistFailureAction, (state, { error }) => ({
    ...state, error: error, loading: false
  })),

  on(SystemLoggingActionTypes.LoadCrashDetailAction, state => ({
    ...state, loading: true
  })),

  on(SystemLoggingActionTypes.LoadCrashDetailSuccessAction, (state, { crashdetail }) => ({
    ...state, crashDetail: crashdetail, loading: false
  })),

  on(SystemLoggingActionTypes.LoadCrashDetailFailureAction, (state, { error }) => ({
    ...state, error: error, loading: false
  })),

  on(SystemLoggingActionTypes.DeleteCrashDetailAction, state => ({
    ...state, loading: true
  })),

  on(SystemLoggingActionTypes.DeleteCrashDetailSuccessAction, (state, { crashlist }) => ({
    ...state, crashes: crashlist, loading: false
  })),

  on(SystemLoggingActionTypes.DeleteCrashDetailFailureAction, (state, { error }) => ({
    ...state, error: error, loading: false
  }))
);

export function reducer(state: SystemLoggingState | undefined, action: Action) {
  return configLoadingReducer(state, action);
}

