import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';
import { HapDeviceState } from '../reducer/HapDevice.reducer';

export const selectHapDeviceState =
  createFeatureSelector<HapDeviceState>('hapDevices');

export const deviceLoadingError = createSelector(
  selectHapDeviceState,
  (state: HapDeviceState): boolean => state.error !== undefined
);

export const deviceLoading = createSelector(
  selectHapDeviceState,
  (state: HapDeviceState): boolean => state.loading
);

export const selectDeviceCount = createSelector(
  selectHapDeviceState,
  (state: HapDeviceState): number =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list.length : 0
);

export const selectAllDevices = createSelector(
  selectHapDeviceState,
  (state: HapDeviceState): HapAppliance[] =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list : []
);
