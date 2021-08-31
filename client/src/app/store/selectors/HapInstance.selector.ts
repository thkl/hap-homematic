import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HapInstance } from '../models/HapInstance.model';
import { HapInstanceState } from '../reducer/HapInstance.reducer';

export const selectHapInstanceState =
  createFeatureSelector<HapInstanceState>('hapInstances');

export const instanceLoadingError = createSelector(
  selectHapInstanceState,
  (state: HapInstanceState): boolean => state.error !== undefined
);

export const instancesLoading = createSelector(
  selectHapInstanceState,
  (state: HapInstanceState): boolean => state.loading
);

export const selectInstanceCount = createSelector(
  selectHapInstanceState,
  (state: HapInstanceState): number =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list.length : 0
);

export const selectAllInstances = createSelector(
  selectHapInstanceState,
  (state: HapInstanceState): HapInstance[] =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list : []
);
