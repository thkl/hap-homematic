import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import * as configReducer from './reducer/SystemConfig.reducer';
import * as hapInstanceReducer from './reducer/HapInstance.reducer';
import * as hapApplianceReducer from './reducer/HapAppliance.reducer';

import * as localizationReducer from './reducer/Localization.reducer';
import * as roomLoadingReducer from './reducer/CCURoom.reducer';
import * as ccuDeviceLoadingReducer from './reducer/CCUDevice.reducer';

import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../../environments/environment';
import { SystemConfigEffects } from './effects/SystemConfig.effect';

import { HapApplianceEffects } from './effects/HapAppliance.effect';
import { HapInstanceEffects } from './effects/HapInstance.effect';
import { LocalizationEffects } from './effects/Localization.effect';
import { CCURoomEffects } from './effects/CCURoom.effect';
import { CCUDevicesEffects } from './effects/CCUDevice.effect';

@NgModule({
  declarations: [],

  imports: [
    StoreModule.forRoot({
      systemConfigState: configReducer.reducer,
      hapInstances: hapInstanceReducer.reducer,
      hapAppliances: hapApplianceReducer.reducer,
      localizationData: localizationReducer.reducer,
      ccuRooms: roomLoadingReducer.reducer,
      ccuDevices: ccuDeviceLoadingReducer.reducer
    }),

    EffectsModule.forRoot([
      SystemConfigEffects,
      HapInstanceEffects,
      HapApplianceEffects,
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
