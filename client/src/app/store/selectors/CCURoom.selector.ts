import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CCURoom } from '../models/CCUObjects.model';
import { CCURoomState } from '../reducer/CCURoom.reducer';

export const selectCCURoomState =
  createFeatureSelector<CCURoomState>('ccuRooms');

export const roomLoadingError = createSelector(
  selectCCURoomState,
  (state: CCURoomState): boolean => state.error !== undefined
);

export const roomsLoading = createSelector(
  selectCCURoomState,
  (state: CCURoomState): boolean => state.loading
);

export const selectRoomCount = createSelector(
  selectCCURoomState,
  (state: CCURoomState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list.length : 0
);

export const selectAllRooms = createSelector(
  selectCCURoomState,
  (state: CCURoomState): CCURoom[] =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list : []
);


export const selectRoomById = (id: number) => createSelector(
  selectCCURoomState,
  (state: CCURoomState) => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.id === id))[0] : undefined
);

