import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CCUProgram } from '../models';
import { CCUProgramState } from '../reducer/CCUProgram.reducer';

export const selectCCUProgramState =
  createFeatureSelector<CCUProgramState>('ccuPrograms');

export const ccuProgramsLoadingError = createSelector(
  selectCCUProgramState,
  (state: CCUProgramState): boolean => state.error !== undefined
);

export const ccuProgramsLoading = createSelector(
  selectCCUProgramState,
  (state: CCUProgramState): boolean => state.loading
);

export const selectProgramCount = createSelector(
  selectCCUProgramState,
  (state: CCUProgramState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list.length : 0
);

export const selectAllCCUPrograms = createSelector(
  selectCCUProgramState,
  (state: CCUProgramState): CCUProgram[] =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list : []
);


export const selectProgramByName = (name: string) => createSelector(
  selectCCUProgramState,
  (state: CCUProgramState) => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.name === name))[0] : undefined
);

export const selectProgramById = (id: number) => createSelector(
  selectCCUProgramState,
  (state: CCUProgramState) => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.id === id))[0] : undefined
);
