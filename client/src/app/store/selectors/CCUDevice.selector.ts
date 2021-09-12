import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CCUChannel, CCUDevice } from '../models/CCUObjects.model';
import { CCUDeviceState } from '../reducer/CCUDevice.reducer';

export const selectCCUDeviceState =
  createFeatureSelector<CCUDeviceState>('ccuDevices');

export const ccuDeviceLoadingError = createSelector(
  selectCCUDeviceState,
  (state: CCUDeviceState): boolean => state.error !== undefined
);

export const ccuDevicesLoading = createSelector(
  selectCCUDeviceState,
  (state: CCUDeviceState): boolean => state.loading
);

export const selectCCUDeviceCount = createSelector(
  selectCCUDeviceState,
  (state: CCUDeviceState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list.length : 0
);

export const selectAllCCUDevices = createSelector(
  selectCCUDeviceState,
  (state: CCUDeviceState): CCUDevice[] =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list : []
);


export const selectDeviceByAddress = (address: string) => createSelector(
  selectCCUDeviceState,
  (state: CCUDeviceState) => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.device === address))[0] : undefined
);

const getChannelByAddress = (list: CCUDevice[], address: string) => {
  const dadr = address.split(':')[0]
  const device = list.filter(item => (item.device === dadr))[0];
  if (device !== undefined) {
    return device.channels.filter(citem => (citem.address === address))[0];
  }
  return undefined;
}


export const selectChannelByAddress = (address: string) => createSelector(
  selectCCUDeviceState,
  (state: CCUDeviceState): CCUChannel =>
    ((state !== undefined) && (state.list !== undefined)) ? getChannelByAddress(state.list, address) : undefined
);

