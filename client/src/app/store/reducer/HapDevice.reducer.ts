import { newArray } from '@angular/compiler/src/util';
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
  ),
  on(HapDeviceActionTypes.SaveHapDeviceAction,
    (state, { payload }) => {
      const index = state.list.findIndex(appl => appl.UUID === payload.UUID); //finding index of the item
      const newList = [...state.list]; //making a new array
      if (index === -1) {
        newList.push(payload);
      } else {
        newList[index] = payload;
      }
      return {
        ...state,
        list: newList
      }
    }
  )
);

export function reducer(state: HapDeviceState | undefined, action: Action) {
  return deviceLoadingReducer(state, action);
}
