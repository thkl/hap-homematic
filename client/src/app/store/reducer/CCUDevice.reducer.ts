import { Action, createReducer, on } from '@ngrx/store';
import * as CCUDeviceActionTypes from '../actions/CCUObjects.action';
import { CCUDevice } from '../models/CCUObjects.model';

export interface CCUDeviceState {
  list: CCUDevice[];
  loading: boolean;
  error?: Error;
}
export const initialState: CCUDeviceState = {
  list: [],
  loading: false,
  error: undefined,
};

const ccuDeviceLoadingReducer = createReducer(
  initialState,
  on(CCUDeviceActionTypes.LoadCCUDevicesAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    CCUDeviceActionTypes.LoadCCUDevicesSuccessAction,
    (state, { result }) => ({
      ...state,
      list: result.devices,
      loading: false,
    })
  ),
  on(
    CCUDeviceActionTypes.LoadCCUDevicesFailureAction,
    (state, { error }) => ({
      ...state,
      error: error,
      loading: false,
    })
  )
);

export function reducer(state: CCUDeviceState | undefined, action: Action) {
  return ccuDeviceLoadingReducer(state, action);
}
