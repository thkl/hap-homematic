import { Action, createReducer, on } from '@ngrx/store';
import * as HapDeviceActionTypes from '../actions/HapAppliance.action';
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

const updateApplianceList = (state: HapDeviceState, payload: HapAppliance) => {
  const index = state.list.findIndex(appl => appl.address === payload.address); //finding index of the item
  const newList = [...state.list]; //making a new array
  if (index === -1) {
    newList.push(payload);
  } else {
    newList[index] = payload;
  }
  return newList;
}

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

  on(HapDeviceActionTypes.SaveHapDeviceToApiAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(HapDeviceActionTypes.SaveHapDeviceAction,
    (state, { payload }) => {

      return {
        ...state,
        loading: false,
        list: updateApplianceList(state, payload)
      }
    }
  ),

  on(HapDeviceActionTypes.SaveHapDeviceActionSuccess,
    (state, { payload }) => {
      return {
        ...state,
        loading: false,
        list: updateApplianceList(state, payload)
      }
    }
  ),

  on(HapDeviceActionTypes.AddHapDeviceAction,
    (state, { payload }) => {
      const newList = [...state.list]; //making a new array
      newList.push(payload);
      return {
        ...state,
        loading: false,
        list: newList
      }
    }
  ),
  on(HapDeviceActionTypes.CleanHapApplianceStore, (state) => {
    const newList = [...state.list].filter(tmpAp => (tmpAp.isTemporary === false || tmpAp.isTemporary === undefined)); //making a new array

    return {
      ...state,
      list: newList
    }
  })

);

export function reducer(state: HapDeviceState | undefined, action: Action) {
  return deviceLoadingReducer(state, action);
}
