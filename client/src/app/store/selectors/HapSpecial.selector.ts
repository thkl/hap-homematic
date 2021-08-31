import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';
import { HapSpecialDeviceState } from '../reducer/HapSpecial.reducer';

export const selectHapSpecialDeviceState =
  createFeatureSelector<HapSpecialDeviceState>('hapSpecialDevices');

export const specialDeviceLoadingError = createSelector(
  selectHapSpecialDeviceState,
  (state: HapSpecialDeviceState): boolean => state.error !== undefined
);

export const specialDeviceLoading = createSelector(
  selectHapSpecialDeviceState,
  (state: HapSpecialDeviceState): boolean => state.loading
);

export const selectSpecialDeviceCount = createSelector(
  selectHapSpecialDeviceState,
  (state: HapSpecialDeviceState): number =>
    state.list !== undefined ? state.list.length : 0
);

export const selectAllSpecialDevices = createSelector(
  selectHapSpecialDeviceState,
  (state: HapSpecialDeviceState): HapAppliance[] =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list : []
);
