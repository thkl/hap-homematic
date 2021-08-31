import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';
import { HapVariableState } from '../reducer/HapVariableReducer';

export const selectHapVariableState =
  createFeatureSelector<HapVariableState>('hapVariables');

export const variablesLodingError = createSelector(
  selectHapVariableState,
  (state: HapVariableState): boolean => state.error !== undefined
);

export const variablesLoading = createSelector(
  selectHapVariableState,
  (state: HapVariableState): boolean => state.loading
);

export const selectVariableCount = createSelector(
  selectHapVariableState,
  (state: HapVariableState): number =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list.length : 0
);

export const selectAllVariables = createSelector(
  selectHapVariableState,
  (state: HapVariableState): HapAppliance[] =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list : []
);

export const selectVariableTrigger = createSelector(
  selectHapVariableState,
  (state: HapVariableState): string => state.trigger
);
