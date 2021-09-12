import { HapInstanceState } from '../reducer/HapInstance.reducer';
import { CCURoomState } from '../reducer/CCURoom.reducer';
import { LocalizationState } from '../reducer/Localization.reducer';
import { ConfigState } from '../reducer/SystemConfig.reducer';
import { CCUDeviceState } from '../reducer/CCUDevice.reducer';
import { HapApplianceState } from '../reducer/HapAppliance.reducer';
import { CCUVariableState } from '../reducer/CCUVariables.reducer';

export interface AppState {
  readonly systemConfigState: ConfigState;
  readonly hapInstances: HapInstanceState;
  readonly hapAppliances: HapApplianceState;
  readonly localizationData: LocalizationState;
  readonly ccuRooms: CCURoomState;
  readonly ccuDevices: CCUDeviceState;
  readonly ccuVariables: CCUVariableState;
  readonly hapTemporaryAppliances: HapApplianceState;
}
