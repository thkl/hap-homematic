import { createAction, props } from "@ngrx/store";

export enum SystemLoggingActionTypes {
  LOAD_LOGFILE = '[SystemLogging] Load LogFile',
  LOAD_LOGFILE_SUCCESS = '[SystemLogging] Load LogFile Success',
  LOAD_LOGFILE_FAILED = '[SystemLogging] Load LogFile Failed',

  LOAD_CRASHLIST = '[SystemLogging] Load Crashlist',
  LOAD_CRASHLIST_SUCCESS = '[SystemLogging] Load Crashlist Success',
  LOAD_CRASHLIST_FAILED = '[SystemLogging] Load Crashlist Failed',

  LOAD_CRASH = '[SystemLogging] Load Crashdetails',
  LOAD_CRASH_SUCCESS = '[SystemLogging] Load Crashdetails Success',
  LOAD_CRASH_FAILED = '[SystemLogging] Load Crashdetails Failed',

  DELETE_CRASH = '[SystemLogging] Delete Crashdetails',
  DELETE_CRASH_SUCCESS = '[SystemLogging] Delete Crashdetails Success',
  DELETE_CRASH_FAILED = '[SystemLogging] Delete Crashdetails Failed',

  SWITCH_DEBUG = '[SystemLogging] Switch Debug',
  // The Success Action will be a new System Config
  SWITCH_DEBUG_FAILED = '[SystemLogging] Switch Debug Failed',
}

export const LoadSystemLogfileAction = createAction(SystemLoggingActionTypes.LOAD_LOGFILE);
export const LoadSystemLogfileSuccessAction = createAction(SystemLoggingActionTypes.LOAD_LOGFILE_SUCCESS, props<{ result: string }>());
export const LoadSystemLogfileFailureAction = createAction(SystemLoggingActionTypes.LOAD_LOGFILE_FAILED, props<{ error: Error }>());

export const LoadCrashlistAction = createAction(SystemLoggingActionTypes.LOAD_CRASHLIST);
export const LoadCrashlistSuccessAction = createAction(SystemLoggingActionTypes.LOAD_CRASHLIST_SUCCESS, props<{ crashlist: string[] }>());
export const LoadCrashlistFailureAction = createAction(SystemLoggingActionTypes.LOAD_CRASHLIST_FAILED, props<{ error: Error }>());

export const LoadCrashDetailAction = createAction(SystemLoggingActionTypes.LOAD_CRASH, props<{ timestamp: string }>());
export const LoadCrashDetailSuccessAction = createAction(SystemLoggingActionTypes.LOAD_CRASH_SUCCESS, props<{ crashdetail: string }>());
export const LoadCrashDetailFailureAction = createAction(SystemLoggingActionTypes.LOAD_CRASH_FAILED, props<{ error: Error }>());

export const DeleteCrashDetailAction = createAction(SystemLoggingActionTypes.DELETE_CRASH, props<{ timestamp: string }>());
export const DeleteCrashDetailSuccessAction = createAction(SystemLoggingActionTypes.DELETE_CRASH_SUCCESS, props<{ crashlist: string[] }>());
export const DeleteCrashDetailFailureAction = createAction(SystemLoggingActionTypes.DELETE_CRASH_FAILED, props<{ error: Error }>());

export const SwitchDebugAction = createAction(SystemLoggingActionTypes.SWITCH_DEBUG, props<{ enable: boolean }>());
export const SwitchDebugFailureAction = createAction(SystemLoggingActionTypes.SWITCH_DEBUG_FAILED, props<{ error: Error }>());

