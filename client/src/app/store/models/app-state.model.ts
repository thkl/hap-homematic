import { HapDeviceState } from '../reducer/HapAppliance.reducer';
import { HapInstanceState } from '../reducer/HapInstance.reducer';
import { HapProgramState } from '../reducer/HapProgram.reducer';
import { CCURoomState } from '../reducer/CCURoom.reducer';
import { HapSpecialDeviceState } from '../reducer/HapSpecial.reducer';
import { HapVariableState } from '../reducer/HapVariableReducer';
import { LocalizationState } from '../reducer/Localization.reducer';
import { ConfigState } from '../reducer/SystemConfig.reducer';
import { CCUDeviceState } from '../reducer/CCUDevice.reducer';

export interface AppState {
  readonly systemConfigState: ConfigState;
  readonly hapInstances: HapInstanceState;
  readonly hapPrograms: HapProgramState;
  readonly hapDevices: HapDeviceState;
  readonly hapVariables: HapVariableState;
  readonly hapSpecialDevices: HapSpecialDeviceState;
  readonly localizationData: LocalizationState;
  readonly ccuRooms: CCURoomState;
  readonly ccuDevices: CCUDeviceState;
}
