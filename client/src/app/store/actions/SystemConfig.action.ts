import { Action, createAction, props } from '@ngrx/store';
import { SystemConfig } from '../models/SystemConfig.model';

export enum SystemConfigActionTypes {
  LOAD_CONFIG = '[SystemConfig] Load Config',
  LOAD_CONFIG_SUCCESS = '[SystemConfig] Load Config Success',
  LOAD_CONFIG_FAILED = '[SystemConfig] Load Config Failed',
  SAVE_CONFIG = '[SystemConfig] Save Config',
  SAVE_CONFIG_SUCCESS = '[SystemConfig] Save Config Success',
  SAVE_CONFIG_FAILED = '[SystemConfig] Save Config Failed',
}

export const LoadSystemConfigAction = createAction(SystemConfigActionTypes.LOAD_CONFIG);
export const LoadSystemConfigSuccessAction = createAction(SystemConfigActionTypes.LOAD_CONFIG_SUCCESS, props<{ systemConfig: SystemConfig }>());
export const LoadSystemConfigFailureAction = createAction(SystemConfigActionTypes.LOAD_CONFIG_FAILED, props<{ payload: Error }>());
