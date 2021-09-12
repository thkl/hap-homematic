import { Action, createReducer, on } from '@ngrx/store';
import * as CCUDeviceActionTypes from '../actions/CCUDevice.action';
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
    (state, { payload }) => ({
      ...state,
      list: payload.devices,
      loading: false,
    })
  ),
  on(
    CCUDeviceActionTypes.LoadCCUDevicesFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: CCUDeviceState | undefined, action: Action) {
  return ccuDeviceLoadingReducer(state, action);
}
