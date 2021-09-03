import { Action, createAction, props } from '@ngrx/store';
import { HapInstance } from '../models/HapInstance.model';


export enum HapInstanceActionTypes {
  LOAD_INSTANCES = '[HAP Instance] Load Instance',
  LOAD_INSTANCES_SUCCESS = '[HAP Instance] Load Instance Success',
  LOAD_INSTANCES_FAILED = '[HAP Instance] Load Instance Failed',
  SAVE_INSTANCE = '[HAP Instance] Save Instance',
  SAVE_INSTANCE_SUCCESS = '[HAP Instance] Save Instance Success',
  SAVE_INSTANCE_FAILED = '[HAP Instance] Save Instance Failed',
}

export const LoadHapInstanceAction = createAction(HapInstanceActionTypes.LOAD_INSTANCES);
export const LoadHapInstanceSuccessAction = createAction(HapInstanceActionTypes.LOAD_INSTANCES_SUCCESS, props<{ payload: HapInstance[] }>());
export const LoadHapInstanceFailureAction = createAction(HapInstanceActionTypes.LOAD_INSTANCES_FAILED, props<{ payload: Error }>());
