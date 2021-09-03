import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HapRoom } from '../models/HapRoom.model';
import { HapRoomState } from '../reducer/HapRoom.reducer';

export const selectHapRoomState =
  createFeatureSelector<HapRoomState>('hapRooms');

export const roomLoadingError = createSelector(
  selectHapRoomState,
  (state: HapRoomState): boolean => state.error !== undefined
);

export const roomsLoading = createSelector(
  selectHapRoomState,
  (state: HapRoomState): boolean => state.loading
);

export const selectRoomCount = createSelector(
  selectHapRoomState,
  (state: HapRoomState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list.length : 0
);

export const selectAllRooms = createSelector(
  selectHapRoomState,
  (state: HapRoomState): HapRoom[] =>
    ((state !== undefined) && (state.list !== undefined)) ? state.list : []
);


export const selectRoomById = (id: number) => createSelector(
  selectHapRoomState,
  (state: HapRoomState) => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.id === id))[0] : undefined
);

