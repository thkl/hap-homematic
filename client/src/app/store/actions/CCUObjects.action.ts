import { createAction, props } from "@ngrx/store";
import { CCUDeviceLoadingResult, CCURoomLoadingResult, CCUVariableLoadingResult } from "../models";

export enum CCUObjectsActionTypes {
  LOAD_CCUDEVICES = '[CCU Devices] Load List',
  LOAD_CCUDEVICES_SUCCESS = '[CCU Devices] Load List Success',
  LOAD_CCUDEVICES_FAILED = '[CCU Devices] Load List Failed',

  LOAD_ROOMS = '[CCU Room] Load List',
  LOAD_ROOMS_SUCCESS = '[CCU Room] Load List Success',
  LOAD_ROOMS_FAILED = '[CCU Room] Load List Failed',

  LOAD_CCUVARIABLES = '[CCU Variables] Load List',
  LOAD_CCUVARIABLES_SUCCESS = '[CCU Variables] Load List Success',
  LOAD_CCUVARIABLES_FAILED = '[CCU Variables] Load List Failed'
}

export const LoadCCUDevicesAction = createAction(
  CCUObjectsActionTypes.LOAD_CCUDEVICES
);
export const LoadCCUDevicesSuccessAction = createAction(
  CCUObjectsActionTypes.LOAD_CCUDEVICES_SUCCESS,
  props<{ result: CCUDeviceLoadingResult }>()
);
export const LoadCCUDevicesFailureAction = createAction(
  CCUObjectsActionTypes.LOAD_CCUDEVICES_FAILED,
  props<{ error: Error }>()
);



export const LoadCCURoomsAction = createAction(
  CCUObjectsActionTypes.LOAD_ROOMS
);
export const LoadCCURoomsSuccessAction = createAction(
  CCUObjectsActionTypes.LOAD_ROOMS_SUCCESS,
  props<{ result: CCURoomLoadingResult }>()
);
export const LoadCCURoomsFailureAction = createAction(
  CCUObjectsActionTypes.LOAD_ROOMS_FAILED,
  props<{ error: Error }>()
);


export const LoadCCUVariablesAction = createAction(
  CCUObjectsActionTypes.LOAD_CCUVARIABLES
);
export const LoadCCUVariablesSuccessAction = createAction(
  CCUObjectsActionTypes.LOAD_CCUVARIABLES_SUCCESS,
  props<{ result: CCUVariableLoadingResult }>()
);
export const LoadCCUVariablesFailureAction = createAction(
  CCUObjectsActionTypes.LOAD_CCUVARIABLES_FAILED,
  props<{ error: Error }>()
);

