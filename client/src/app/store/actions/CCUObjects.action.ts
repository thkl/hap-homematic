import { createAction, props } from "@ngrx/store";
import { CCUDeviceLoadingResult, CCURoomLoadingResult, CCUVariableLoadingResult } from "../models";

export enum CCUObjectsActionTypes {
  LOAD_CCU_DEVICES = '[CCU Devices] Load List',
  LOAD_CCU_DEVICES_SUCCESS = '[CCU Devices] Load List Success',
  LOAD_CCU_DEVICES_FAILED = '[CCU Devices] Load List Failed',

  LOAD_CCU_ROOMS = '[CCU Room] Load List',
  LOAD_CCU_ROOMS_SUCCESS = '[CCU Room] Load List Success',
  LOAD_CCU_ROOMS_FAILED = '[CCU Room] Load List Failed',

  LOAD_CCU_VARIABLES = '[CCU Variables] Load List',
  LOAD_CCU_VARIABLES_SUCCESS = '[CCU Variables] Load List Success',
  LOAD_CCU_VARIABLES_FAILED = '[CCU Variables] Load List Failed'
}

export const LoadCCUDevicesAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_DEVICES
);
export const LoadCCUDevicesSuccessAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_DEVICES_SUCCESS,
  props<{ result: CCUDeviceLoadingResult }>()
);
export const LoadCCUDevicesFailureAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_DEVICES_FAILED,
  props<{ error: Error }>()
);



export const LoadCCURoomsAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_ROOMS
);
export const LoadCCURoomsSuccessAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_ROOMS_SUCCESS,
  props<{ result: CCURoomLoadingResult }>()
);
export const LoadCCURoomsFailureAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_ROOMS_FAILED,
  props<{ error: Error }>()
);


export const LoadCCUVariablesAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_VARIABLES
);
export const LoadCCUVariablesSuccessAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_VARIABLES_SUCCESS,
  props<{ result: CCUVariableLoadingResult }>()
);
export const LoadCCUVariablesFailureAction = createAction(
  CCUObjectsActionTypes.LOAD_CCU_VARIABLES_FAILED,
  props<{ error: Error }>()
);

