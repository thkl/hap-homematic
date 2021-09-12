import { createAction, props } from '@ngrx/store';
import { CCUVariableLoadingResult } from '../models/CCUObjects.model';

export enum CCUVariableActionTypes {
  LOAD_CCUVARIABLES = '[CCU Variables] Load List',
  LOAD_CCUVARIABLES_SUCCESS = '[CCU Variables] Load List Success',
  LOAD_CCUVARIABLES_FAILED = '[CCU Variables] Load List Failed'
}

export const LoadCCUVariablesAction = createAction(
  CCUVariableActionTypes.LOAD_CCUVARIABLES
);
export const LoadCCUVariablesSuccessAction = createAction(
  CCUVariableActionTypes.LOAD_CCUVARIABLES_SUCCESS,
  props<{ payload: CCUVariableLoadingResult }>()
);
export const LoadCCUVariablesFailureAction = createAction(
  CCUVariableActionTypes.LOAD_CCUVARIABLES_FAILED,
  props<{ payload: Error }>()
);
