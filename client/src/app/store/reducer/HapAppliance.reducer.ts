import { Action, createReducer, on } from '@ngrx/store';
import * as HapApplianceActionTypes from '../actions/HapAppliance.action';
import { HapAppliance } from '../models/HapAppliance.model';

export interface HapApplianceState {
  list: HapAppliance[];
  loading: boolean;
  saving: boolean;
  varTrigger: string;
  error?: Error;
}
export const initialState: HapApplianceState = {
  list: [],
  loading: false,
  saving: false,
  varTrigger: undefined,
  error: undefined,
};

const updateApplianceList = (state: HapApplianceState, payload: HapAppliance[]) => {
  const newList = [...state.list]; //making a new array
  if (payload !== undefined) {
    payload.forEach(appliance => {

      const index = state.list.findIndex(appl => appl.address === appliance.address); //finding index of the item
      if (index === -1) {
        newList.push(appliance);
      } else {
        newList[index] = appliance;
      }
    })
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
    (state, { loadingResult }) => ({
      ...state,
      list: loadingResult.appliances,
      varTrigger: loadingResult.varTrigger,
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
    saving: true,
    loading: true,
  })),

  on(HapApplianceActionTypes.SaveHapApplianceToApiActionSuccess,
    (state, { result }) => {
      return {
        ...state,
        saving: false,
        loading: false,
        list: updateApplianceList(state, result.appliances)
      }
    }
  ),

  on(HapApplianceActionTypes.DeleteHapApplianceAction,
    (state, { applianceToDelete }) => {
      const newList = [...state.list].filter(tmpAp => (tmpAp.address !== applianceToDelete.address)); //making a new array and remove the item in payload
      return {
        ...state,
        list: newList,
      }
    }
  ),

  on(
    HapApplianceActionTypes.DeleteHapApplianceFromApiActionSuccess,
    (state, { payload }) => {

      const newList = [...state.list].filter(appliance => (appliance.address !== payload.deleted)); //making a new array and remove the item in payload

      return {
        ...state,
        loading: false,
        error: null,
        list: newList
      }
    }
  )
);

export function reducer(state: HapApplianceState | undefined, action: Action) {
  return applianceLoadingReducer(state, action);
}
