import { Action, createReducer, on, State } from '@ngrx/store';
import * as SystemConfigActionTypes from '../actions/SystemConfig.action';
import { SystemConfig } from '../models/SystemConfig.model';

export interface ConfigState {
    config: SystemConfig,
    loading: boolean,
    error?: Error
}
export const initialState: ConfigState = {
    config: {},
    loading: false,
    error: undefined
};


const configLoadingReducer = createReducer(
    initialState,
    on(SystemConfigActionTypes.LoadSystemConfigAction, state => ({
        ...state, loading: true
    })),

    on(SystemConfigActionTypes.LoadSystemConfigSuccessAction, (state, { payload }) => ({
        ...state, config: payload, loading: false
    })),
    on(SystemConfigActionTypes.LoadSystemConfigFailureAction, (state, { payload }) => ({
        ...state, error: payload, loading: false
    })),

);

export function reducer(state: ConfigState | undefined, action: Action) {
    return configLoadingReducer(state, action);
}

