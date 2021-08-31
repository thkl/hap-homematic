import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { PipeModule } from "src/app/pipes/pipes.module";
import { AppliancelistHeaderComponent } from "./header_appliancelist/header_appliancelist.component";
import { HeaderComponent } from "./header/header.component";
import { InstancelistHeaderComponent } from "./instancelist/instancelist.component";
import { SystemstateComponent } from "./systemstate/systemstate.component";

@NgModule({
  declarations: [
    AppliancelistHeaderComponent,
    HeaderComponent,
    SystemstateComponent,
    InstancelistHeaderComponent,
  ],
  imports: [
    PipeModule,
    CommonModule,
    BrowserModule,],
  exports: [HeaderComponent],
  bootstrap: [HeaderComponent],
})
export class HeaderModule { }
