import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SystemConfig } from '../models';
import { ConfigState } from '../reducer/SystemConfig.reducer';

export const selectHapConfigState =
  createFeatureSelector<ConfigState>('systemConfigState');

export const configData = createSelector(
  selectHapConfigState,
  (state: ConfigState): SystemConfig => state.config
);

export const configIsLoading = createSelector(
  selectHapConfigState,
  (state: ConfigState): boolean => state.loading
);

export const configLoadingError = createSelector(
  selectHapConfigState,
  (state: ConfigState): Error => state.error
);



export const configLoaded = createSelector(
  selectHapConfigState,
  (state: ConfigState): boolean => (Object.keys(state.config).length > 0)
);
