import { createFeatureSelector, createSelector } from '@ngrx/store';
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

const getAllAppliances = (list: HapAppliance[], type: HapApplicanceType) => {
  if (type === HapApplicanceType.All) {
    return list;
  } else {
    return list.filter(item => (item.applianceType === type));
  }
}

export const selectAppliancesCount = (type: HapApplicanceType) => createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, type).length : 0
);

export const selectAllAppliances = (type: HapApplicanceType) => createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): HapAppliance[] => ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, type) : []
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

export const selectVariableTrigger = createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): string => ((state !== undefined) ? state.varTrigger : '')
);

export const selectCreateVariableHelper = createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): boolean =>
    ((state !== undefined) ? state.createHelper : false)
);


export const appliancesSaving = createSelector(
  selectHapApplianceState,
  (state: HapApplianceState): boolean =>
    ((state !== undefined) && (state.saving !== undefined) && (state.saving))
);
