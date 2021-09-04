import { createAction, props } from '@ngrx/store';
import { CCUDevice } from '../models/CCUDevice.model';

export enum CCUDeviceActionTypes {
  LOAD_CCUDEVICES = '[CCU Devices] Load List',
  LOAD_CCUDEVICES_SUCCESS = '[CCU Devices] Load List Success',
  LOAD_CCUDEVICES_FAILED = '[CCU Devices] Load List Failed'
}

export const LoadCCUDevicesAction = createAction(
  CCUDeviceActionTypes.LOAD_CCUDEVICES
);
export const LoadCCUDevicesSuccessAction = createAction(
  CCUDeviceActionTypes.LOAD_CCUDEVICES_SUCCESS,
  props<{ payload: CCUDevice[] }>()
);
export const LoadCCUDevicesFailureAction = createAction(
  CCUDeviceActionTypes.LOAD_CCUDEVICES_FAILED,
  props<{ payload: Error }>()
);
