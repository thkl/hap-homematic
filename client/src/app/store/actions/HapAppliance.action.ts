import { createAction, props } from '@ngrx/store';
import { HapAppliance, HapApplianceLoadResult, HapApplianceSaveResult } from '../models/HapAppliance.model';

export enum HapApplianceActionTypes {
  LOAD_APPLIANCES = '[HAP Appliance] Load List',
  LOAD_APPLIANCES_SUCCESS = '[HAP Appliance] Load List Success',
  LOAD_APPLIANCES_FAILED = '[HAP Appliance] Load List Failed',
  SAVE_APPLIANCE = '[HAP Appliance] Save Appliance',
  SAVE_APPLIANCE_TO_API = '[HAP Appliance] Save Appliance To Api',
  SAVE_APPLIANCE_SUCCESS = '[HAP Appliance] Save Appliance Success',
  SAVE_APPLIANCE_FAILED = '[HAP Appliance] Save Appliance Failed',

  ADD_APPLIANCE = '[HAP Appliance] Add Appliance',
  EDIT_APPLIANCE = '[HAP Appliance] Edit Appliance',

  DELETE_TMP_APPLIANCE = '[HAP Appliance] Delete Temporary Appliance',
  DELETE_APPLIANCE = '[HAP Appliance] Delete Appliance',
  CLEAN_APPLIANCE_STORE = '[HAP Appliance] Clean Store'
}

export const LoadHapAppliancesAction = createAction(
  HapApplianceActionTypes.LOAD_APPLIANCES
);
export const LoadHapAppliancesSuccessAction = createAction(
  HapApplianceActionTypes.LOAD_APPLIANCES_SUCCESS,
  props<{ payload: HapApplianceLoadResult }>()
);
export const LoadHapAppliancesFailureAction = createAction(
  HapApplianceActionTypes.LOAD_APPLIANCES_FAILED,
  props<{ payload: Error }>()
);


export const SaveHapApplianceAction = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE,
  props<{ payload: HapAppliance }>()
);

export const DeleteHapApplianceAction = createAction(
  HapApplianceActionTypes.DELETE_APPLIANCE,
  props<{ payload: HapAppliance }>()
);

export const DeleteTemporaryHapApplianceAction = createAction(
  HapApplianceActionTypes.DELETE_TMP_APPLIANCE,
  props<{ payload: HapAppliance }>()
);



export const SaveHapApplianceToApiAction = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE_TO_API,
  props<{ payload: HapAppliance[] }>()
);

export const SaveHapApplianceActionSuccess = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE_SUCCESS,
  props<{ payload: HapApplianceSaveResult }>()
);

export const SaveHapApplianceailureAction = createAction(
  HapApplianceActionTypes.SAVE_APPLIANCE_FAILED,
  props<{ payload: Error }>()
);

//this will add a appliance to the temp state
export const AddHapApplianceAction = createAction(
  HapApplianceActionTypes.ADD_APPLIANCE,
  props<{ payload: HapAppliance }>()
);

//this will copy a appliance with the address x to the temp state
export const EditHapApplianceAction = createAction(
  HapApplianceActionTypes.ADD_APPLIANCE,
  props<{ payload: string }>()
);


export const CleanHapApplianceStore = createAction(
  HapApplianceActionTypes.CLEAN_APPLIANCE_STORE
);
