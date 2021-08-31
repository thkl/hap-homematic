import { PipeTransform, Pipe } from '@angular/core';
import { LocalizationService } from '../service/localization.service';

@Pipe({
    name: 'localize',
    pure: true
})


export class LocalizerPipe implements PipeTransform {
    constructor(
        private localizationService: LocalizationService
    ) { }


    transform(msg: string, parameter?: any[]): any {
        return this.localizationService.l18n(msg, parameter);
    }

}
