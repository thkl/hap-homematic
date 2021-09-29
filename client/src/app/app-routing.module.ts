import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeviceListComponent } from './components/appliances/devices/devices.component';
import { InstancelistComponent } from './components/instances/instancelist/instancelist.component';
import { ProgramlistComponent } from './components/appliances/programs/programlist/programlist.component';
import { ShellComponent } from './components/shell/shell.component';
import { SpeciallistComponent } from './components/appliances/special/speciallist/speciallist.component';
import { VariablelistComponent } from './components/appliances/variables/variablelist/variablelist.component';
import { LocalizationResolver } from './service/localization.resolver';
import { InstancedetailComponent } from './components/instances/instancedetail/instancedetail.component';
import { ApplicanceListResolver } from './service/appliance.resolver';
import { EditApplianceComponent } from './components/appliances/editappliance/editappliance.component';
import { NewApplianceWizzardFrameComponent } from './components/appliances/newappliancewizzard/wizzardframe/wizzardframe.component';
import { DebugComponent } from './components/system/debug/debug.component';
import { LogViewerComponent } from './components/system/logviewer/logviewer.component';
import { CrashlogsComponent } from './components/system/crashlogs/crashlogs.component';
import { RestartComponent } from './components/system/restart/restart.component';
import { SettingsComponent } from './components/system/settings/settings.component';
import { ResetsystemComponent } from './components/system/resetsystem/resetsystem.component';
import { WizzardComponent } from './components/welcome/wizzard/wizzard.component';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    resolve: { phrases: LocalizationResolver },
    children: [
      { path: '', redirectTo: 'devices', pathMatch: 'full' },

      {
        path: 'devices', component: DeviceListComponent,
        data: { breadcrumb: 'Devices' },
      },

      {
        path: 'device/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new device' }
      },

      {
        path: 'appliance/:address', component: EditApplianceComponent,
        resolve: { loaded: ApplicanceListResolver },
        data: { breadcrumb: 'Edit appliance' },
      },


      {
        path: 'variables', component: VariablelistComponent,
        data: { breadcrumb: 'Variables' },
      },

      { path: 'variables/:id', component: VariablelistComponent },
      {
        path: 'variable/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Variable' }
      },

      {
        path: 'programs', component: ProgramlistComponent,
        data: { breadcrumb: 'Programs' },
      },

      { path: 'programs/:id', component: ProgramlistComponent },
      {
        path: 'program/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Program' },
      },

      {
        path: 'special', component: SpeciallistComponent,
        data: { breadcrumb: 'Special Appliances' }
      },
      {
        path: 'special/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Special device' },
      },
      {
        path: 'instances', component: InstancelistComponent,
        data: { breadcrumb: 'Instances' }
      },

      {
        path: 'instances/detail/:id', component: InstancedetailComponent,
        data: { breadcrumb: 'Edit Instance' }
      },

      {
        path: 'instances/new', component: InstancedetailComponent,
        data: { breadcrumb: 'New Instance' }
      },
      {
        path: 'debug', component: DebugComponent,
        data: { breadcrumb: 'Debugging' },
        children: [
          {
            path: '', component: LogViewerComponent,
            data: { breadcrumb: 'Logging' }
          },
          {
            path: 'logging', component: LogViewerComponent,
            data: { breadcrumb: 'Logging' }
          },
          {
            path: 'crash', component: CrashlogsComponent,
            data: { breadcrumb: 'Crashes' }
          },
          {
            path: 'reset', component: ResetsystemComponent,
            data: { breadcrumb: 'Reset All' }
          }
        ]
      },
      {
        path: 'settings', component: SettingsComponent,
        data: { breadcrumb: 'Settings' }
      },
      {
        path: 'restart', component: RestartComponent,
        data: { breadcrumb: 'Restart' },
      },
      {
        path: 'welcome', component: WizzardComponent
      }
    ],
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
