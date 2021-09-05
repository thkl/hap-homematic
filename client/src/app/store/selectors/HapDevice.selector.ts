import { createFeatureSelector, createSelector } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { HapAppliance } from '../models/HapAppliance.model';
import { HapDeviceState } from '../reducer/HapDevice.reducer';

export const selectHapApplianceState =
  createFeatureSelector<HapDeviceState>('hapDevices');

export const applianceLoadingError = createSelector(
  selectHapApplianceState,
  (state: HapDeviceState): boolean => state.error !== undefined
);

export const appliancesLoading = createSelector(
  selectHapApplianceState,
  (state: HapDeviceState): boolean => state.loading
);




const getAllAppliances = (list: HapAppliance[], includeTemporary: boolean) => {
  if (includeTemporary === true) {
    return list;
  } else {
    return list.filter(item => ((item.isTemporary === false) || item.isTemporary === undefined))
  }
}

export const selectAppliancesCount = (includeTemporary: boolean) => createSelector(
  selectHapApplianceState,
  (state: HapDeviceState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, includeTemporary).length : 0
);

export const selectAllAppliances = (includeTemporary: boolean) => createSelector(
  selectHapApplianceState,
  (state: HapDeviceState): HapAppliance[] => ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, includeTemporary) : []
);

export const appliancesLoaded = createSelector(
  selectHapApplianceState,
  (state: HapDeviceState): boolean =>
    ((state !== undefined) && (state.list !== undefined) && (state.list.length > 0))
);


export const selectApplianceById = (id: string) => createSelector(
  selectHapApplianceState,
  (state: HapDeviceState): HapAppliance => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.UUID === id))[0] : undefined
);

export const selectApplianceByAddress = (address: string) => createSelector(
  selectHapApplianceState,
  (state: HapDeviceState): HapAppliance => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.address === address))[0] : undefined
);
