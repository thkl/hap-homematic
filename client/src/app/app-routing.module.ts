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
import { NewDevicewizzardComponent } from './components/devices/newdevicewizzard/newdevicewizzard.component';
import { ApplicanceListResolver } from './service/appliance.resolver';
import { EditApplianceComponent } from './components/appliances/editappliance/editappliance.component';

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

      { path: 'device/new', component: NewDevicewizzardComponent },

      {
        path: 'device/:address', component: EditApplianceComponent,
        resolve: { loaded: ApplicanceListResolver },
        data: { breadcrumb: 'Edit device' },
      },


      {
        path: 'variables', component: VariablelistComponent,
        data: { breadcrumb: 'Variables' },
      },

      { path: 'variables/:id', component: VariablelistComponent },

      {
        path: 'programs', component: ProgramlistComponent,
        data: { breadcrumb: 'Programs' },
      },

      { path: 'programs/:id', component: ProgramlistComponent },

      {
        path: 'special', component: SpeciallistComponent,
        data: { breadcrumb: 'Special Appliances' }
      },

      {
        path: 'instances', component: InstancelistComponent,
        data: { breadcrumb: 'Instances' }
      },

      {
        path: 'instances/detail/:id', component: InstancedetailComponent,
        data: { breadcrumb: 'Edit Instance' }
      }
    ],
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
