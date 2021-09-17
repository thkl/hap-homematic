import { createAction, props } from '@ngrx/store';
import { HapAppliance, HapApplianceDeletingResult, HapApplianceLoadResult, HapApplianceSaveResult } from '../models/HapAppliance.model';

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

  DELETE_APPLIANCE_FROM_API = '[HAP Appliance] Delete Appliance from API',
  DELETE_APPLIANCE_FROM_API_SUCCESS = '[HAP Appliance] Delete Appliance from API Success',
  DELETE_APPLIANCE_FROM_API_FAILED = '[HAP Appliance] Delete Appliance from API Failed',

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
  props<{ applianceToSave: HapAppliance }>()
);

export const DeleteHapApplianceAction = createAction(
  HapApplianceActionTypes.DELETE_APPLIANCE,
  props<{ applianceToDelete: HapAppliance }>()
);

export const DeleteHapApplianceFromApiAction = createAction(
  HapApplianceActionTypes.DELETE_APPLIANCE_FROM_API,
  props<{ applianceToDelete: HapAppliance }>()
);


export const DeleteHapApplianceFromApiActionSuccess = createAction(
  HapApplianceActionTypes.DELETE_APPLIANCE_FROM_API_SUCCESS,
  props<{ payload: HapApplianceDeletingResult }>()
);

export const DeleteHapApplianceFromApiFailureAction = createAction(
  HapApplianceActionTypes.DELETE_APPLIANCE_FROM_API_FAILED,
  props<{ payload: Error }>()
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





