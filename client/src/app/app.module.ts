import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CommonModule } from '@angular/common';

import { MenuComponent } from './components/menu/menu/menu.component';
import { AppliancelistComponent } from './components/appliances/appliancelist/appliancelist.component';
import { VariablelistComponent } from './components/variables/variablelist/variablelist.component';

import { ProgramlistComponent } from './components/programlist/programlist.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule } from '@angular/material/sort';

import { LocalizationResolver } from './service/localization.resolver';
import { ShellComponent } from './components/shell/shell.component';
import { StorageModule } from './store/storage.module';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { InstancelistComponent } from './components/instances/instancelist/instancelist.component';
import { HeaderModule } from './components/header/header.module';
import { PipeModule } from './pipes/pipes.module';
import { SpeciallistComponent } from './components/special/speciallist/speciallist.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    AppliancelistComponent,
    VariablelistComponent,
    ProgramlistComponent,
    ShellComponent,
    BreadcrumbsComponent,
    InstancelistComponent,
    SpeciallistComponent,
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
    HeaderModule
  ],
  providers: [LocalizationResolver],
  bootstrap: [AppComponent],
})
export class AppModule { }
