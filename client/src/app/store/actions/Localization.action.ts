import { createAction, props } from '@ngrx/store';
import { LocalizationPhrase } from '../models/LocalizationPhrase.model';

export enum LocalizationActionTypes {
  LOAD = '[HAP Locale] Load List',
  LOAD_SUCCESS = '[HAP Locale] Load List Success',
  LOAD_FAILED = '[HAP Locale] Load List Failed'
}

export const LoadPhrasesAction = createAction(
  LocalizationActionTypes.LOAD
);
export const LoadPhrasesSuccessAction = createAction(
  LocalizationActionTypes.LOAD_SUCCESS,
  props<{ payload: LocalizationPhrase }>()
);
export const LoadPhrasesFailureAction = createAction(
  LocalizationActionTypes.LOAD_FAILED,
  props<{ payload: Error }>()
);
