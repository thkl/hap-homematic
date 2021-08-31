import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';
import { HapProgramState } from '../reducer/HapProgram.reducer';

export const selectHapProgramState =
  createFeatureSelector<HapProgramState>('hapPrograms');

export const programsLodingError = createSelector(
  selectHapProgramState,
  (state: HapProgramState): boolean => state.error !== undefined
);

export const programsLoading = createSelector(
  selectHapProgramState,
  (state: HapProgramState): boolean => state.loading
);

export const selectProgramCount = createSelector(
  selectHapProgramState,
  (state: HapProgramState): number =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list.length : 0
);

export const selectAllPrograms = createSelector(
  selectHapProgramState,
  (state: HapProgramState): HapAppliance[] =>
    ((state !== undefined) && (state.list !== undefined))  ? state.list : []
);
