import { Action, createReducer, on } from '@ngrx/store';
import * as LocalizationActionTypes from '../actions/Localization.action';
import { LocalizationPhrase } from '../models/LocalizationPhrase.model';

export interface LocalizationState {
  data: LocalizationPhrase;
  loading: boolean;
  error?: Error;
}
export const initialState: LocalizationState = {
  data: {},
  loading: false,
  error: undefined,
};

const deviceLoadingReducer = createReducer(
  initialState,
  on(LocalizationActionTypes.LoadPhrasesAction, (state) => ({
    ...state,
    loading: true,
  })),

  on(
    LocalizationActionTypes.LoadPhrasesSuccessAction,
    (state, { payload }) => ({
      ...state,
      data: payload,
      loading: false,
    })
  ),
  on(
    LocalizationActionTypes.LoadPhrasesFailureAction,
    (state, { payload }) => ({
      ...state,
      error: payload,
      loading: false,
    })
  )
);

export function reducer(state: LocalizationState | undefined, action: Action) {
  return deviceLoadingReducer(state, action);
}
