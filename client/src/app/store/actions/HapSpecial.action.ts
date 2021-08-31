import { createAction, props } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';

export enum HapSpecialDevicesActionTypes {
  LOAD_DEVICE = '[HAP Special] Load List',
  LOAD_DEVICE_SUCCESS = '[HAP Special] Load List Success',
  LOAD_DEVICE_FAILED = '[HAP Special] Load List Failed',
  SAVE_DEVICE = '[HAP Special] Save Device',
  SAVE_DEVICE_SUCCESS = '[HAP Special] Save Device Success',
  SAVE_DEVICE_FAILED = '[HAP Special] Save Device Failed',
}

export const LoadHapSpecialDevicesAction = createAction(
  HapSpecialDevicesActionTypes.LOAD_DEVICE
);
export const LoadHapSpecialDevicesSuccessAction = createAction(
  HapSpecialDevicesActionTypes.LOAD_DEVICE_SUCCESS,
  props<{ payload: HapAppliance[] }>()
);
export const LoadHapSpecialDevicesFailureAction = createAction(
  HapSpecialDevicesActionTypes.LOAD_DEVICE_FAILED,
  props<{ payload: Error }>()
);
