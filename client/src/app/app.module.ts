import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule } from '@angular/material/sort';

import { MenuComponent } from './components/menu/menu/menu.component';
import { StorageModule } from './store/storage.module';
import { PipeModule } from './pipes/pipes.module';

import { LocalizationResolver } from './service/localization.resolver';

import { ShellComponent } from './components/shell/shell.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { InstancelistComponent } from './components/instances/instancelist/instancelist.component';
import { HeaderModule } from './components/header/header.module';
import { DeviceListComponent } from './components/appliances/devices/devices.component';
import { VariablelistComponent } from './components/appliances/variables/variablelist/variablelist.component';
import { ProgramlistComponent } from './components/appliances/programs/programlist/programlist.component';
import { SpeciallistComponent } from './components/appliances/special/speciallist/speciallist.component';
import { InstancedetailComponent } from './components/instances/instancedetail/instancedetail.component';
import { QrCodeModule } from 'ng-qrcode';
import { DropdownmenuComponent } from './components/util/dropdownmenu/dropdownmenu.component';


@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    DeviceListComponent,
    VariablelistComponent,
    ProgramlistComponent,
    ShellComponent,
    BreadcrumbsComponent,
    InstancelistComponent,
    SpeciallistComponent,
    InstancedetailComponent,
    DropdownmenuComponent,
  ],
  imports: [
    HttpClientModule,
    CommonModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    CdkTableModule,
    MatSortModule,
    StorageModule,
    PipeModule,
    NoopAnimationsModule,
    HeaderModule,
    QrCodeModule
  ],
  providers: [LocalizationResolver],
  bootstrap: [AppComponent],
})
export class AppModule { }
