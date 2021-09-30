import { createAction, props } from '@ngrx/store';
import { HapInstance, HapInstanceCoreData, HapInstanceDeletingResult, HapInstanceSavingResult } from '../models/HapInstance.model';


export enum HapInstanceActionTypes {
  LOAD_INSTANCES = '[HAP Instance] Load Instance',
  LOAD_INSTANCES_SUCCESS = '[HAP Instance] Load Instance Success',
  LOAD_INSTANCES_FAILED = '[HAP Instance] Load Instance Failed',

  CREATE_INSTANCE_AT_API = '[HAP Instance] Create Instance',
  ACTIVATE_INSTANCE_AT_API = '[HAP Instance] Activate Instance',
  ACTIVATE_INSTANCE_AT_API_SUCCESS = '[HAP Instance] Activate Instance Success',
  ACTIVATE_INSTANCE_AT_API_FAILED = '[HAP Instance] Activate Instance Failed',

  SAVE_INSTANCE_TO_API = '[HAP Instance] Save Instance',
  SAVE_INSTANCE_TO_API_SUCCESS = '[HAP Instance] Save Instance Success',
  SAVE_INSTANCE_TO_API_FAILED = '[HAP Instance] Save Instance Failed',

  DELETE_INSTANCE_FROM_API = '[HAP Instance] Delete Instance',
  DELETE_INSTANCE_FROM_API_SUCCESS = '[HAP Instance] Delete Instance Success',
  DELETE_INSTANCE_FROM_API_FAILED = '[HAP Instance] Delete Instance Failed',


}

export const LoadHapInstanceAction = createAction(
  HapInstanceActionTypes.LOAD_INSTANCES
);

export const LoadHapInstanceSuccessAction = createAction(
  HapInstanceActionTypes.LOAD_INSTANCES_SUCCESS,
  props<{ payload: HapInstance[] }>());

export const LoadHapInstanceFailureAction = createAction(
  HapInstanceActionTypes.LOAD_INSTANCES_FAILED,
  props<{ payload: Error }>()
);

export const SaveHapInstanceToApiAction = createAction(
  HapInstanceActionTypes.SAVE_INSTANCE_TO_API,
  props<{ payload: HapInstance[] }>()
);

export const CreateHapInstanceAtApiAction = createAction(
  HapInstanceActionTypes.CREATE_INSTANCE_AT_API,
  props<{ payload: HapInstanceCoreData[] }>()
);


export const SaveHapInstanceToApiSuccessAction = createAction(
  HapInstanceActionTypes.SAVE_INSTANCE_TO_API_SUCCESS,
  props<{ payload: HapInstanceSavingResult }>()
);

export const SaveHapInstanceToApiFailureAction = createAction(
  HapInstanceActionTypes.LOAD_INSTANCES_FAILED,
  props<{ payload: Error }>());

export const DeleteHapInstanceFromApiAction = createAction(
  HapInstanceActionTypes.DELETE_INSTANCE_FROM_API,
  props<{ payload: HapInstance[] }>()
);

export const DeleteHapInstanceFromApiSuccessAction = createAction(
  HapInstanceActionTypes.DELETE_INSTANCE_FROM_API_SUCCESS,
  props<{ payload: HapInstanceDeletingResult }>()
);

export const DeleteHapInstanceFromApiFailureAction = createAction(
  HapInstanceActionTypes.DELETE_INSTANCE_FROM_API_FAILED,
  props<{ payload: Error }>()
);

export const ActivateHapInstanceAtApiAction = createAction(
  HapInstanceActionTypes.ACTIVATE_INSTANCE_AT_API,
  props<{ instances: string[] }>()
);

export const ActivateHapInstanceAtApiSuccessAction = createAction(
  HapInstanceActionTypes.ACTIVATE_INSTANCE_AT_API_SUCCESS,
  props<{ result: string }>()
);

export const ActivateHapInstanceAtApiFailureAction = createAction(
  HapInstanceActionTypes.ACTIVATE_INSTANCE_AT_API_FAILED,
  props<{ error: Error }>());
