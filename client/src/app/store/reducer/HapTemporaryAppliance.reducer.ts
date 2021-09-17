import { Action, createReducer, on } from '@ngrx/store';
import * as HapApplianceActionTypes from '../actions/HapAppliance.action';
import { HapAppliance } from '../models/HapAppliance.model';
import { HapApplianceState } from './HapAppliance.reducer';

export const initialState: HapApplianceState = {
  list: [],
  loading: false,
  saving: false,
  varTrigger: undefined,
  error: undefined,
};

const updateApplianceList = (state: HapApplianceState, payload: HapAppliance) => {
  const index = state.list.findIndex(appl => ((appl !== undefined) && (appl.address === payload.address))); //finding index of the item
  const newList = [...state.list]; //making a new array
  if (index === -1) {
    newList.push(payload);
  } else {
    newList[index] = payload;
  }
  return newList;
}

const applianceLoadingReducer = createReducer(
  initialState,

  on(HapApplianceActionTypes.SaveHapApplianceAction,
    (state, { applianceToSave }) => {

      return {
        ...state,
        loading: false,
        list: updateApplianceList(state, applianceToSave)
      }
    }
  ),

  on(HapApplianceActionTypes.AddHapApplianceAction,
    (state, { payload }) => {
      const newList = [...state.list]; //making a new array
      if ((payload !== undefined) && (payload !== null)) {
        newList.push(payload);
      }
      return {
        ...state,
        loading: false,
        list: newList
      }
    }
  ),

  on(HapApplianceActionTypes.DeleteTemporaryHapApplianceAction,
    (state, { payload }) => {
      const newList = [...state.list].filter(tmpAp => (tmpAp.address !== payload.address)); //making a new array and remove the item in payload
      return {
        ...state,
        list: newList,
      }
    }
  ),

  on(HapApplianceActionTypes.CleanHapApplianceStore, (state) => {
    return {
      ...state,
      list: []
    }
  })

);

export function reducer(state: HapApplianceState | undefined, action: Action) {
  return applianceLoadingReducer(state, action);
}
