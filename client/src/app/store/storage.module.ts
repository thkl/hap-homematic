import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import * as configReducer from './reducer/SystemConfig.reducer';
import * as hapInstanceReducer from './reducer/HapInstance.reducer';
import * as hapProgramsReducer from './reducer/HapProgram.reducer';
import * as hapDevicesReducer from './reducer/HapAppliance.reducer';
import * as hapVariableReducer from './reducer/HapVariableReducer';

import * as hapSpecialDevicesReducer from './reducer/HapSpecial.reducer';
import * as localizationReducer from './reducer/Localization.reducer';
import * as roomLoadingReducer from './reducer/CCURoom.reducer';
import * as ccuDeviceLoadingReducer from './reducer/CCUDevice.reducer';

import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../../environments/environment';
import { SystemConfigEffects } from './effects/SystemConfig.effect';

import { HapDeviceEffects } from './effects/HapAppliance.effect';
import { HapProgramEffects } from './effects/HapProgram.effect';
import { HapInstanceEffects } from './effects/HapInstance.effect';
import { HapVariableEffects } from './effects/HapVariable.effect';
import { HapSpecialDeviceEffects } from './effects/HapSpecialDevice.effect';
import { LocalizationEffects } from './effects/Localization.effect';
import { CCURoomEffects } from './effects/CCURoom.effect';
import { CCUDevicesEffects } from './effects/CCUDevice.effect';

@NgModule({
  declarations: [],

  imports: [
    StoreModule.forRoot({
      systemConfigState: configReducer.reducer,
      hapInstances: hapInstanceReducer.reducer,
      hapPrograms: hapProgramsReducer.reducer,
      hapDevices: hapDevicesReducer.reducer,
      hapVariables: hapVariableReducer.reducer,
      hapSpecialDevices: hapSpecialDevicesReducer.reducer,
      localizationData: localizationReducer.reducer,
      ccuRooms: roomLoadingReducer.reducer,
      ccuDevices: ccuDeviceLoadingReducer.reducer
    }),

    EffectsModule.forRoot([
      SystemConfigEffects,
      HapInstanceEffects,
      HapProgramEffects,
      HapDeviceEffects,
      HapVariableEffects,
      HapSpecialDeviceEffects,
      LocalizationEffects,
      CCURoomEffects,
      CCUDevicesEffects
    ]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),

  ]
})
export class StorageModule { }
