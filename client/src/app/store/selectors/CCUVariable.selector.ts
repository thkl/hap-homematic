import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CCUVariable } from '../models';
import { CCUVariableState } from '../reducer/CCUVariables.reducer';

export const selectCCUVariableState =
  createFeatureSelector<CCUVariableState>('ccuVariables');

export const ccuVariablesLoadingError = createSelector(
  selectCCUVariableState,
  (state: CCUVariableState): boolean => state.error !== undefined
);

export const ccuVariablesLoading = createSelector(
  selectCCUVariableState,
  (state: CCUVariableState): boolean => state.loading
);

export const selectVariableCount = createSelector(
  selectCCUVariableState,
  (state: CCUVariableState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list.length : 0
);

export const selectAllCCUVariables = createSelector(
  selectCCUVariableState,
  (state: CCUVariableState): CCUVariable[] =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list : []
);


export const selectVariableByName = (name: string) => createSelector(
  selectCCUVariableState,
  (state: CCUVariableState) => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.name === name))[0] : undefined
);

export const selectVariableById = (id: number) => createSelector(
  selectCCUVariableState,
  (state: CCUVariableState) => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.id === id))[0] : undefined
);
