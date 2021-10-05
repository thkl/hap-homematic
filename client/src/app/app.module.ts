import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule } from '@angular/material/sort';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';

import { MenuComponent } from './components/menu/menu/menu.component';
import { StorageModule } from './store/storage.module';
import { PipeModule } from './pipes/pipes.module';

import { LocalizationResolver } from './service/localization.resolver';

import { ShellComponent } from './components/shell/shell.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { InstancelistComponent } from './components/instances/instancelist/instancelist.component';
import { DeviceListComponent } from './components/appliances/devices/devices.component';
import { VariablelistComponent } from './components/appliances/variables/variablelist/variablelist.component';
import { ProgramlistComponent } from './components/appliances/programs/programlist/programlist.component';
import { SpeciallistComponent } from './components/appliances/special/speciallist/speciallist.component';
import { InstancedetailComponent } from './components/instances/instancedetail/instancedetail.component';
import { QrCodeModule } from 'ng-qrcode';
import { DropdownmenuComponent } from './components/util/dropdownmenu/dropdownmenu.component';
import { CCCUDevicelistComponent } from './components/ccuobjects/ccudevicelist/ccudevicelist.component';
import { AppliancePropertiesComponent } from './components/appliances/applianceproperties/applianceproperties.component';
import { ApplicanceListResolver } from './service/appliance.resolver';
import { EditApplianceComponent } from './components/appliances/editappliance/editappliance.component';
import { NewApplianceWizzardFrameComponent } from './components/appliances/newappliancewizzard/wizzardframe/wizzardframe.component';
import { NewApplianceWizzardFinishComponent } from './components/appliances/newappliancewizzard/finish/finish.component';
import { PaginationComponent } from './components/util/pagination/pagination.component';
import { CCUVariablelistComponent } from './components/ccuobjects/ccuvariablelist/ccuvariablelist.component';
import { ConfirmationDialogComponent } from './components/util/confirmation/confirmation.component';
import { CCUProgramlistComponent } from './components/ccuobjects/ccuprogramlist/ccuprogramlist.component';
import { SettingsinputComponent } from './components/util/settingsinput/settingsinput.component';
import { DatapointselectorComponent } from './components/util/datapointselector/datapointselector.component';

import { LoggerModule } from "ngx-logger";
import { environment } from 'src/environments/environment';
import { LogViewerComponent } from './components/system/logviewer/logviewer.component';
import { CrashlogsComponent } from './components/system/crashlogs/crashlogs.component';
import { DebugComponent } from './components/system/debug/debug.component';
import { RestartComponent } from './components/system/restart/restart.component';
import { SettingsComponent } from './components/system/settings/settings.component';
import { ResetsystemComponent } from './components/system/resetsystem/resetsystem.component';
import { WizzardComponent } from './components/welcome/wizzard/wizzard.component';
import { StepInstancesComponent } from './components/welcome/step-instances/step-instances.component';
import { CCURoomlistComponent } from './components/welcome/ccuroomlist/ccuroomlist.component';
import { StepAppliancesComponent } from './components/welcome/step-appliances/step-appliances.component';
import { LoginComponent } from './components/system/login/login.component';
import { ErrorInterceptor } from './service/error.interceptor';
import { ConfigResolver } from './service/config.resolver';
import { BackupComponent } from './components/system/backup/backup.component';
import { ChangelogComponent } from './components/system/changelog/changelog.component';
import { AppliancelistHeaderComponent } from './components/header/header_appliancelist/header_appliancelist.component';
import { HeaderComponent } from './components/header/header/header.component';
import { SystemstateComponent } from './components/header/systemstate/systemstate.component';
import { InstancelistHeaderComponent } from './components/header/instancelist/instancelist.component';
import { ToastComponent } from './components/util/toast/toast.component';
import { HelpComponent } from './components/system/help/help.component';

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
    CCCUDevicelistComponent,
    NewApplianceWizzardFrameComponent,
    AppliancePropertiesComponent,
    EditApplianceComponent,
    NewApplianceWizzardFinishComponent,
    PaginationComponent,
    CCUVariablelistComponent,
    ConfirmationDialogComponent,
    CCUProgramlistComponent,
    SettingsinputComponent,
    DatapointselectorComponent,
    LogViewerComponent,
    CrashlogsComponent,
    DebugComponent,
    RestartComponent,
    SettingsComponent,
    ResetsystemComponent,
    WizzardComponent,
    StepInstancesComponent,
    CCURoomlistComponent,
    StepAppliancesComponent,
    LoginComponent,
    BackupComponent,
    ChangelogComponent,
    AppliancelistHeaderComponent,
    HeaderComponent,
    SystemstateComponent,
    InstancelistHeaderComponent,
    ToastComponent,
    HelpComponent,
  ],
  imports: [
    HttpClientModule,
    CommonModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    CdkTableModule,
    CdkTreeModule,
    MatSortModule,
    MatIconModule,
    StorageModule,
    PipeModule,
    NoopAnimationsModule,
    QrCodeModule,
    LoggerModule.forRoot({
      level: environment.logLevel
    })
  ],

  providers: [
    LocalizationResolver,
    ApplicanceListResolver,
    ConfigResolver,
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule { }
