import { Action, createReducer, on } from '@ngrx/store';
import * as HapSpecialDeviceActionTypes from '../actions/HapSpecial.action';
import { HapAppliance } from '../models/HapAppliance.model';

export interface HapSpecialDeviceState {
  list: HapAppliance[];
  loading: boolean;
  error?: Error;
}
export const initialState: HapSpecialDeviceState = {
  list: [],
  loading: false,
  error: undefined,
};

const deviceLoadingReducer = createReducer(
  initialState,
  on(HapSpecialDeviceActionTypes.LoadHapSpecialDevicesAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapSpecialDeviceActionTypes.LoadHapSpecialDevicesSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload,
      loading: false,
    })
  ),
  on(
    HapSpecialDeviceActionTypes.LoadHapSpecialDevicesFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: HapSpecialDeviceState | undefined, action: Action) {
  return deviceLoadingReducer(state, action);
}
