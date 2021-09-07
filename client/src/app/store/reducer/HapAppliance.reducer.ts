import { Action, createReducer, on } from '@ngrx/store';
import * as HapApplianceActionTypes from '../actions/HapAppliance.action';
import { HapApplianceService } from '../models';
import { HapAppliance } from '../models/HapAppliance.model';

export interface HapApplianceState {
  list: HapAppliance[];
  loading: boolean;
  varTrigger: string;
  varServices: HapApplianceService[];
  error?: Error;
}
export const initialState: HapApplianceState = {
  list: [],
  loading: false,
  varTrigger: undefined,
  varServices: [],
  error: undefined,
};

const updateApplianceList = (state: HapApplianceState, payload: HapAppliance) => {
  const index = state.list.findIndex(appl => appl.address === payload.address); //finding index of the item
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
  on(HapApplianceActionTypes.LoadHapAppliancesAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapApplianceActionTypes.LoadHapAppliancesSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload.appliances,
      varTrigger: payload.varTrigger,
      varServices: payload.varServices,
      loading: false,
    })
  ),
  on(
    HapApplianceActionTypes.LoadHapAppliancesFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  ),

  on(HapApplianceActionTypes.SaveHapApplianceToApiAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(HapApplianceActionTypes.SaveHapApplianceAction,
    (state, { payload }) => {

      return {
        ...state,
        loading: false,
        list: updateApplianceList(state, payload)
      }
    }
  ),

  on(HapApplianceActionTypes.SaveHapApplianceActionSuccess,
    (state, { payload }) => {
      return {
        ...state,
        loading: false,
        list: updateApplianceList(state, payload)
      }
    }
  ),

  on(HapApplianceActionTypes.AddHapApplianceAction,
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
  on(HapApplianceActionTypes.CleanHapApplianceStore, (state) => {
    const newList = [...state.list].filter(tmpAp => (tmpAp.isTemporary === false || tmpAp.isTemporary === undefined)); //making a new array

    return {
      ...state,
      list: newList
    }
  })

);

export function reducer(state: HapApplianceState | undefined, action: Action) {
  return applianceLoadingReducer(state, action);
}
