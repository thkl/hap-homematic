import { PipeTransform, Pipe } from '@angular/core';
import { LocalizationService } from '../service/localization.service';

@Pipe({
    name: 'pluralize',
    pure: true
})


export class PluralizePipe implements PipeTransform {
    constructor(
        private localizationService: LocalizationService
    ) { }


    transform(value: number, singular: string, plural: string): any {
        const msg = (value === 1) ? singular : plural;
        const result = this.localizationService.l18n(msg, [value]);
        return result;
    }

}
