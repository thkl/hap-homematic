import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LocalizationPhrase } from '../models';
import { LocalizationState } from '../reducer/Localization.reducer';

export const selectLocalizationState =
  createFeatureSelector<LocalizationState>('localizationData');

export const localizationData = createSelector(
  selectLocalizationState,
  (state: LocalizationState): LocalizationPhrase => state.data
);

export const localizationIsLoading = createSelector(
  selectLocalizationState,
  (state: LocalizationState): boolean => state.loading
);

export const localizationLoadingError = createSelector(
  selectLocalizationState,
  (state: LocalizationState): Error => state.error
);


export const localizationLoaded = createSelector(
  selectLocalizationState,
  (state: LocalizationState): boolean => (Object.keys(state.data).length > 0)
);
