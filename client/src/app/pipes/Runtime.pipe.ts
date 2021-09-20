import { PipeTransform, Pipe } from '@angular/core';
import { LocalizationService } from '../service/localization.service';

@Pipe({
  name: 'runtime',
  pure: true
})


export class RuntimePipe implements PipeTransform {

  constructor(
    private localizationService: LocalizationService
  ) { }

  transform(seconds: number): any {

    if (seconds < 50) {
      return this.localizationService.l18n('less that 1 minute');
    }
    if (seconds < 3600) {
      return this.localizationService.l18n('%s min', [Math.round((seconds / 60))]);
    }
    if (seconds < 86400) {
      const hr = Math.round((seconds / 60 / 60))
      return (hr === 1) ? this.localizationService.l18n('%s hour', [hr]) : this.localizationService.l18n('%s hours', [hr]);
    }
    const d = Math.floor((seconds / 60 / 60 / 24))
    return (d === 1) ? this.localizationService.l18n('%s day', [d]) : this.localizationService.l18n('%s days', [d]);

  }

}
