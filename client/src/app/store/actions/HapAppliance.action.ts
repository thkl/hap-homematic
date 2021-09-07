import { createAction, props } from '@ngrx/store';
import { HapAppliance, HapAppllianceApiCallResult } from '../models/HapAppliance.model';

export enum HapApplianceActionTypes {
  LOAD_APPLIANCES = '[HAP Appliance] Load List',
  LOAD_APPLIANCES_SUCCESS = '[HAP Appliance] Load List Success',
  LOAD_APPLIANCES_FAILED = '[HAP Appliance] Load List Failed',
  SAVE_APPLIANCE = '[HAP Appliance] Save Appliance',
  SAVE_APPLIANCE_TO_API = '[HAP Appliance] Save Appliance To Api',
  SAVE_APPLIANCE_SUCCESS = '[HAP Appliance] Save Appliance Success',
  SAVE_APPLIANCE_FAILED = '[HAP Appliance] Save Appliance Failed',
  ADD_APPLIANCE = '[HAP Appliance] Add Appliance',
  CLEAN_APPLIANCE_STORE = '[HAP Appliance] Clean Store'
}

export const LoadHapAppliancesAction = createAction(
  HapApplianceActionTypes.LOAD_APPLIANCES
);
export const LoadHapAppliancesSuccessAction = createAction(
  HapApplianceActionTypes.LOAD_APPLIANCES_SUCCESS,
  props<{ payload: HapAppllianceApiCallResult }>()
);
export const LoadHapAppliancesFailureAction = createAction(
  HapApplianceActionTypes.LOAD_APPLIANCES_FAILED,
  props<{ payload: Error }>()
);


export const SaveHapApplianceAction = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE,
  props<{ payload: HapAppliance }>()
);

export const SaveHapApplianceToApiAction = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE_TO_API,
  props<{ payload: HapAppliance }>()
);

export const SaveHapApplianceActionSuccess = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE_SUCCESS,
  props<{ payload: HapAppliance }>()
);

export const SaveHapApplianceailureAction = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE_FAILED,
  props<{ payload: Error }>()
);

export const AddHapApplianceAction = createAction(
  HapApplianceActionTypes.ADD_APPLIANCE,
  props<{ payload: HapAppliance }>()
);

export const CleanHapApplianceStore = createAction(
  HapApplianceActionTypes.CLEAN_APPLIANCE_STORE
);
