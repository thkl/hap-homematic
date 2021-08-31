import { createAction, props } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';

export enum HapVariableActionTypes {
  LOAD_VARIABLE = '[HAP Variable] Load List',
  LOAD_VARIABLE_SUCCESS = '[HAP Variable] Load List Success',
  LOAD_VARIABLE_FAILED = '[HAP Variable] Load List Failed',
  SAVE_VARIABLE = '[HAP Variable] Save Variable',
  SAVE_VARIABLE_SUCCESS = '[HAP Variable] Save Variable Success',
  SAVE_VARIABLE_FAILED = '[HAP Variable] Save Variable Failed',
  SAVE_TRIGGER = '[HAP Variable] Save Trigger',
  SAVE_TRIGGER_SUCCESS = '[HAP Variable] Save Trigger Success',
  SAVE_TRIGGER_FAILED = '[HAP Variable] Save Trigger Failed',
}

export const LoadHapVariablesAction = createAction(
  HapVariableActionTypes.LOAD_VARIABLE
);
export const LoadHapVariablesSuccessAction = createAction(
  HapVariableActionTypes.LOAD_VARIABLE_SUCCESS,
  props<{ list: HapAppliance[]; trigger: string }>()
);
export const LoadHapVariablesFailureAction = createAction(
  HapVariableActionTypes.LOAD_VARIABLE_FAILED,
  props<{ error: Error }>()
);
