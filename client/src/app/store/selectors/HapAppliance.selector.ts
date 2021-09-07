import { createFeatureSelector, createSelector } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { HapAppliance, HapApplicanceType } from '../models/HapAppliance.model';
import { HapApplianceState } from '../reducer/HapAppliance.reducer';

export const selectHapApplianceState =
  createFeatureSelector<HapApplianceState>('hapAppliances');

export const applianceLoadingError = createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): boolean => state.error !== undefined
);

export const appliancesLoading = createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): boolean => state.loading
);

const getAllAppliances = (list: HapAppliance[], type: HapApplicanceType, includeTemporary: boolean) => {
  if (includeTemporary === true) {
    return list.filter(item => (item.applianceType === type));
  } else {
    let result = list.filter((item) => {
      const df = (((item.isTemporary === undefined) || (item.isTemporary === false)) && (item.applianceType === type))
      return df;
    })
    console.log(result);
    return result;
  }
}

const getTemporaryAppliances = (list: HapAppliance[]) => {
  return list.filter(item => (item.isTemporary === true))
}

export const selectTemporaryAppliances = createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): HapAppliance[] => ((state !== undefined) && (state.list !== undefined)) ? getTemporaryAppliances(state.list) : []
);

export const selectAppliancesCount = (includeTemporary: boolean, type: HapApplicanceType) => createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, type, includeTemporary).length : 0
);

export const selectAllAppliances = (includeTemporary: boolean, type: HapApplicanceType) => createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): HapAppliance[] => ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, type, includeTemporary) : []
);

export const appliancesLoaded = createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): boolean =>
    ((state !== undefined) && (state.list !== undefined) && (state.list.length > 0))
);


export const selectApplianceById = (id: string) => createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): HapAppliance => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.UUID === id))[0] : undefined
);

export const selectApplianceByAddress = (address: string) => createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): HapAppliance => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.address === address))[0] : undefined
);
