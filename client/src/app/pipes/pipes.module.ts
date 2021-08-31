import { NgModule } from "@angular/core";
import { LocalizerPipe } from "./Localize.pipe";
import { PluralizePipe } from "./Pluralizer.pipe";
import { RuntimePipe } from "./Runtime.pipe";

@NgModule({
  imports: [],
  declarations: [PluralizePipe, RuntimePipe, LocalizerPipe],
  exports: [
    PluralizePipe,
    RuntimePipe,
    LocalizerPipe,],
  bootstrap: [],
})
export class PipeModule { }
