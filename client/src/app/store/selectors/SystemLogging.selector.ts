import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SystemLoggingState } from '../reducer/SystemLogging.reducer';

export const selectSystemLoggingState =
  createFeatureSelector<SystemLoggingState>('systemloggingState');

export const loggingData = createSelector(
  selectSystemLoggingState,
  (state: SystemLoggingState): string => state.loggingData
);

export const logdataIsLoading = createSelector(
  selectSystemLoggingState,
  (state: SystemLoggingState): boolean => state.loading
);

export const logDataLoadingError = createSelector(
  selectSystemLoggingState,
  (state: SystemLoggingState): Error => state.error
);

export const crashList = createSelector(
  selectSystemLoggingState,
  (state: SystemLoggingState): string[] => state.crashes
);

export const crashDetail = createSelector(
  selectSystemLoggingState,
  (state: SystemLoggingState): string => state.crashDetail
);

