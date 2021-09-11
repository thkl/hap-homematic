import { ɵangular_packages_platform_browser_dynamic_platform_browser_dynamic_a } from '@angular/platform-browser-dynamic';
import { Action, createReducer, on } from '@ngrx/store';
import * as HapInstanceActionTypes from '../actions/HapInstance.action';
import { HapInstance } from '../models/HapInstance.model';

export interface HapInstanceState {
  list: HapInstance[];
  loading: boolean;
  error?: Error;
}
export const initialState: HapInstanceState = {
  list: [],
  loading: false,
  error: undefined,
};

const updateInstanceList = (list: HapInstance[], payload: HapInstance) => {
  const index = list.findIndex(appl => appl.id === payload.id); //finding index of the item
  const newList = [...list]; //making a new array
  if (index === -1) {
    newList.push(payload);
  } else {
    newList[index] = payload;
  }
  return newList;
}


const instanceLoadingReducer = createReducer(
  initialState,
  on(HapInstanceActionTypes.LoadHapInstanceAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    HapInstanceActionTypes.LoadHapInstanceSuccessAction,
    (state, { payload }) => ({
      ...state,
      list: payload,
      loading: false,
    })
  ),
  on(
    HapInstanceActionTypes.LoadHapInstanceFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  ),
  on(
    HapInstanceActionTypes.SaveHapInstanceToApiSuccessAction,
    (state, { payload }) => {

      let newList = state.list;
      payload.instances.forEach(instance => {
        newList = updateInstanceList(newList, instance);
      });

      return {
        ...state,
        loading: false,
        error: null,
        list: newList
      }
    }
  ),
  on(
    HapInstanceActionTypes.DeleteHapInstanceFromApiSuccessAction,
    (state, { payload }) => {

      const newList = [...state.list].filter(tmpInstance => (tmpInstance.id !== payload.deleted)); //making a new array and remove the item in payload

      return {
        ...state,
        loading: false,
        error: null,
        list: newList
      }
    }
  )
);

export function reducer(state: HapInstanceState | undefined, action: Action) {
  return instanceLoadingReducer(state, action);
}
