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
import { LoginComponent } from './components/system/login/login.component';
import { AuthGuard } from './service/route.guard';
import { ConfigResolver } from './service/config.resolver';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    resolve: { phrases: LocalizationResolver },
    children: [
      {
        path: '',
        redirectTo: 'devices',
        pathMatch: 'full'
      },

      {
        path: 'devices', component: DeviceListComponent,
        data: { breadcrumb: 'Devices' },
        canActivate: [AuthGuard],
      },

      {
        path: 'device/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new device' },
        canActivate: [AuthGuard]
      },

      {
        path: 'appliance/:address', component: EditApplianceComponent,
        resolve: { loaded: ApplicanceListResolver },
        data: { breadcrumb: 'Edit appliance' },
        canActivate: [AuthGuard]
      },


      {
        path: 'variables', component: VariablelistComponent,
        data: { breadcrumb: 'Variables' },
        canActivate: [AuthGuard]
      },

      {
        path: 'variables/:id', component: VariablelistComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'variable/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Variable' },
        canActivate: [AuthGuard]
      },

      {
        path: 'programs', component: ProgramlistComponent,
        data: { breadcrumb: 'Programs' },
        canActivate: [AuthGuard]
      },

      {
        path: 'programs/:id', component: ProgramlistComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'program/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Program' },
        canActivate: [AuthGuard]
      },

      {
        path: 'special', component: SpeciallistComponent,
        data: { breadcrumb: 'Special Appliances' },
        canActivate: [AuthGuard]
      },
      {
        path: 'special/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Special device' },
        canActivate: [AuthGuard]
      },
      {
        path: 'instances', component: InstancelistComponent,
        data: { breadcrumb: 'Instances' },
        canActivate: [AuthGuard]
      },

      {
        path: 'instances/detail/:id', component: InstancedetailComponent,
        data: { breadcrumb: 'Edit Instance' },
        canActivate: [AuthGuard]
      },

      {
        path: 'instances/new', component: InstancedetailComponent,
        data: { breadcrumb: 'New Instance' },
        canActivate: [AuthGuard]
      },
      {
        path: 'debug', component: DebugComponent,
        data: { breadcrumb: 'Debugging' },
        canActivate: [AuthGuard],
        children: [
          {
            path: '', component: LogViewerComponent,
            data: { breadcrumb: 'Logging' },
            canActivate: [AuthGuard]
          },
          {
            path: 'logging', component: LogViewerComponent,
            data: { breadcrumb: 'Logging' },
            canActivate: [AuthGuard]
          },
          {
            path: 'crash', component: CrashlogsComponent,
            data: { breadcrumb: 'Crashes' },
            canActivate: [AuthGuard]
          },
          {
            path: 'reset', component: ResetsystemComponent,
            data: { breadcrumb: 'Reset All' },
            canActivate: [AuthGuard]
          }
        ]
      },
      {
        path: 'settings', component: SettingsComponent,
        data: { breadcrumb: 'Settings' },
        canActivate: [AuthGuard]
      },
      {
        path: 'restart', component: RestartComponent,
        data: { breadcrumb: 'Restart' },
        canActivate: [AuthGuard]
      },
      {
        path: 'welcome', component: WizzardComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'login', component: LoginComponent,
        resolve: { config: ConfigResolver }
      }
    ],
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
