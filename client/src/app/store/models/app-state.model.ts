import { HapDeviceState } from '../reducer/HapDevice.reducer';
import { HapInstanceState } from '../reducer/HapInstance.reducer';
import { HapProgramState } from '../reducer/HapProgram.reducer';
import { HapRoomState } from '../reducer/HapRoom.reducer';
import { HapSpecialDeviceState } from '../reducer/HapSpecial.reducer';
import { HapVariableState } from '../reducer/HapVariableReducer';
import { LocalizationState } from '../reducer/Localization.reducer';
import { ConfigState } from '../reducer/SystemConfig.reducer';

export interface AppState {
  readonly systemConfigState: ConfigState;
  readonly hapInstances: HapInstanceState;
  readonly hapPrograms: HapProgramState;
  readonly hapDevices: HapDeviceState;
  readonly hapVariables: HapVariableState;
  readonly hapSpecialDevices: HapSpecialDeviceState;
  readonly localizationData: LocalizationState;
  readonly hapRooms: HapRoomState;
}
