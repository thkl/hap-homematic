import { createFeatureSelector, createSelector } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { HapAppliance, HapApplicanceType } from '../models/HapAppliance.model';
import { HapApplianceState } from '../reducer/HapAppliance.reducer';

export const selectHapTemporaryApplianceState =
  createFeatureSelector<HapApplianceState>('hapTemporaryAppliances');

const getAllAppliances = (list: HapAppliance[], type: HapApplicanceType) => {
  if (type === HapApplicanceType.All) {
    return list;
  } else {
    return list.filter(item => (item.applianceType === type));
  }
}

export const selectTemporaryAppliancesCount = (type: HapApplicanceType) => createSelector(
  selectHapTemporaryApplianceState,
  (state: HapApplianceState): number =>
    ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, type).length : 0
);

export const selectAllTemporaryAppliances = (type: HapApplicanceType) => createSelector(
  selectHapTemporaryApplianceState,
  (state: HapApplianceState): HapAppliance[] => ((state !== undefined) && (state.list !== undefined)) ? getAllAppliances(state.list, type) : []
);

export const selectTemporaryApplianceById = (id: string) => createSelector(
  selectHapTemporaryApplianceState,
  (state: HapApplianceState): HapAppliance => ((state !== undefined) && (state.list !== undefined)) ? state.list.filter(item => (item.UUID === id))[0] : undefined
);

export const selectTemporaryApplianceByAddress = (address: string) => createSelector(
  selectHapTemporaryApplianceState,
  (state: HapApplianceState): HapAppliance => (
    (state !== undefined) &&
    (address !== undefined) &&
    (state.list !== undefined)
  ) ? state.list.filter(item => ((item !== undefined) && item.address === address))[0] : undefined
);
