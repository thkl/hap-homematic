import { Action, createReducer, on } from '@ngrx/store';
import * as HapDeviceActionTypes from '../actions/HapDevice.action';
import { HapAppliance } from '../models/HapAppliance.model';

export interface HapDeviceState {
  list: HapAppliance[];
  loading: boolean;
  error?: Error;
}
export const initialState: HapDeviceState = {
  list: [],
  loading: false,
  error: undefined,
};

const deviceLoadingReducer = createReducer(
  initialState,
  on(HapDeviceActionTypes.LoadHapDevicesAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapDeviceActionTypes.LoadHapDevicesSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload,
      loading: false,
    })
  ),
  on(
    HapDeviceActionTypes.LoadHapDevicesFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: HapDeviceState | undefined, action: Action) {
  return deviceLoadingReducer(state, action);
}
