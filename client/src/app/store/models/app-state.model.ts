import { HapDeviceState } from '../reducer/HapDevice.reducer';
import { HapInstanceState } from '../reducer/HapInstance.reducer';
import { HapProgramState } from '../reducer/HapProgram.reducer';
import { HapSpecialDeviceState } from '../reducer/HapSpecial.reducer';
import { HapVariableState } from '../reducer/HapVariableReducer';
import { ConfigState } from '../reducer/SystemConfig.reducer';

export interface AppState {
  readonly systemConfigState: ConfigState;
  readonly hapInstances: HapInstanceState;
  readonly hapPrograms: HapProgramState;
  readonly hapDevices: HapDeviceState;
  readonly hapVariables: HapVariableState;
  readonly hapSpecialDevices: HapSpecialDeviceState;
}
