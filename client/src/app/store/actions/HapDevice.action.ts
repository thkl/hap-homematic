import { createAction, props } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';

export enum HapDeviceActionTypes {
  LOAD_DEVICE = '[HAP Device] Load List',
  LOAD_DEVICE_SUCCESS = '[HAP Device] Load List Success',
  LOAD_DEVICE_FAILED = '[HAP Device] Load List Failed',
  SAVE_DEVICE = '[HAP Device] Save Device',
  SAVE_DEVICE_SUCCESS = '[HAP Device] Save Device Success',
  SAVE_DEVICE_FAILED = '[HAP Device] Save Device Failed',
  ADD_DEVICE = '[HAP Device] Add Device',
  CLEAN_DEVICE_STORE = '[HAP Device] Clean Store'
}

export const LoadHapDevicesAction = createAction(
  HapDeviceActionTypes.LOAD_DEVICE
);
export const LoadHapDevicesSuccessAction = createAction(
  HapDeviceActionTypes.LOAD_DEVICE_SUCCESS,
  props<{ payload: HapAppliance[] }>()
);
export const LoadHapDevicesFailureAction = createAction(
  HapDeviceActionTypes.LOAD_DEVICE_FAILED,
  props<{ payload: Error }>()
);


export const SaveHapDeviceAction = createAction(
  HapDeviceActionTypes.SAVE_DEVICE,
  props<{ payload: HapAppliance }>()
);

export const SaveHapDeviceActionSuccess = createAction(
  HapDeviceActionTypes.SAVE_DEVICE_SUCCESS,
  props<{ payload: HapAppliance }>()
);

export const SaveHapDeviceFailureAction = createAction(
  HapDeviceActionTypes.SAVE_DEVICE_FAILED,
  props<{ payload: Error }>()
);

export const AddHapDeviceAction = createAction(
  HapDeviceActionTypes.ADD_DEVICE,
  props<{ payload: HapAppliance }>()
);

export const CleanHapApplianceStore = createAction(
  HapDeviceActionTypes.CLEAN_DEVICE_STORE
);
