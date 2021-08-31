import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppliancelistComponent } from './components/appliances/appliancelist/appliancelist.component';
import { InstancelistComponent } from './components/instances/instancelist/instancelist.component';
import { ProgramlistComponent } from './components/programlist/programlist.component';
import { ShellComponent } from './components/shell/shell.component';
import { SpeciallistComponent } from './components/special/speciallist/speciallist.component';
import { VariablelistComponent } from './components/variables/variablelist/variablelist.component';
import { LocalizationResolver } from './service/localization.resolver';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    resolve: { phrases: LocalizationResolver },
    children: [
      { path: '', redirectTo: 'devices', pathMatch: 'full' },
      {
        path: 'devices',
        component: AppliancelistComponent,
        data: { breadcrumb: 'Devices' },
      },
      { path: 'devices/:id', component: AppliancelistComponent },
      {
        path: 'variables',
        component: VariablelistComponent,
        data: { breadcrumb: 'Variables' },
      },
      { path: 'variables/:id', component: VariablelistComponent },
      {
        path: 'programs',
        component: ProgramlistComponent,
        data: { breadcrumb: 'Programs' },
      },
      { path: 'programs/:id', component: ProgramlistComponent },

      { path: 'special', component: SpeciallistComponent },

      { path: 'instances', component: InstancelistComponent }

    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
