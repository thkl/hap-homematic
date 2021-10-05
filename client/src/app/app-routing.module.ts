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
import { BackupComponent } from './components/system/backup/backup.component';
import { ChangelogComponent } from './components/system/changelog/changelog.component';
import { HelpComponent } from './components/system/help/help.component';

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
        resolve: { config: ConfigResolver }
      },

      {
        path: 'device/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new device' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },

      {
        path: 'appliance/:address', component: EditApplianceComponent,
        resolve: { loaded: ApplicanceListResolver, config: ConfigResolver },
        data: { breadcrumb: 'Edit appliance' },
        canActivate: [AuthGuard],
      },


      {
        path: 'variables', component: VariablelistComponent,
        data: { breadcrumb: 'Variables' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },

      {
        path: 'variables/:id', component: VariablelistComponent,
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'variable/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Variable' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },

      {
        path: 'programs', component: ProgramlistComponent,
        data: { breadcrumb: 'Programs' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },

      {
        path: 'programs/:id', component: ProgramlistComponent,
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'program/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Program' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },

      {
        path: 'special', component: SpeciallistComponent,
        data: { breadcrumb: 'Special Appliances' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'special/new', component: NewApplianceWizzardFrameComponent,
        data: { breadcrumb: 'Add new Special device' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'instances', component: InstancelistComponent,
        data: { breadcrumb: 'Instances' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },

      {
        path: 'instances/detail/:id', component: InstancedetailComponent,
        data: { breadcrumb: 'Edit Instance' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },

      {
        path: 'instances/new', component: InstancedetailComponent,
        data: { breadcrumb: 'New Instance' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'debug', component: DebugComponent,
        data: { breadcrumb: 'Debugging' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver },
        children: [
          {
            path: '', component: LogViewerComponent,
            data: { breadcrumb: 'Logging' },
            canActivate: [AuthGuard],
            resolve: { config: ConfigResolver }
          },
          {
            path: 'logging', component: LogViewerComponent,
            data: { breadcrumb: 'Logging' },
            canActivate: [AuthGuard],
            resolve: { config: ConfigResolver }
          },
          {
            path: 'crash', component: CrashlogsComponent,
            data: { breadcrumb: 'Crashes' },
            canActivate: [AuthGuard],
            resolve: { config: ConfigResolver }
          },
          {
            path: 'reset', component: ResetsystemComponent,
            data: { breadcrumb: 'Reset All' },
            canActivate: [AuthGuard],
            resolve: { config: ConfigResolver }
          }
        ]
      },
      {
        path: 'settings', component: SettingsComponent,
        data: { breadcrumb: 'Settings' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'restart', component: RestartComponent,
        data: { breadcrumb: 'Restart' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'backup', component: BackupComponent,
        data: { breadcrumb: 'Backup' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'changelog', component: ChangelogComponent,
        data: { breadcrumb: 'Changelog' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'help', component: HelpComponent,
        data: { breadcrumb: 'Help' },
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
      },
      {
        path: 'welcome', component: WizzardComponent,
        canActivate: [AuthGuard],
        resolve: { config: ConfigResolver }
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
