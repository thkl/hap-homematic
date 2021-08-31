import { createAction, props } from '@ngrx/store';
import { HapAppliance } from '../models/HapAppliance.model';

export enum HapProgramActionTypes {
  LOAD_PROGRAM = '[HAP Program] Load List',
  LOAD_PROGRAM_SUCCESS = '[HAP Program] Load List Success',
  LOAD_PROGRAM_FAILED = '[HAP Program] Load List Failed',
  SAVE_PROGRAM = '[HAP Program] Save Program',
  SAVE_PROGRAM_SUCCESS = '[HAP Program] Save Program Success',
  SAVE_PROGRAM_FAILED = '[HAP Program] Save Program Failed',
}

export const LoadHapProgramsAction = createAction(
  HapProgramActionTypes.LOAD_PROGRAM
);
export const LoadHapProgramsSuccessAction = createAction(
  HapProgramActionTypes.LOAD_PROGRAM_SUCCESS,
  props<{ payload: HapAppliance[] }>()
);
export const LoadHapProgramsFailureAction = createAction(
  HapProgramActionTypes.LOAD_PROGRAM_FAILED,
  props<{ payload: Error }>()
);
