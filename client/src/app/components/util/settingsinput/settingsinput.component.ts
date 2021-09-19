import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LocalizationService } from 'src/app/service/localization.service';
import { SettingsValidator } from 'src/app/validators/validator';

@Component({
  selector: 'settingsinput',
  templateUrl: './settingsinput.component.html',
  styleUrls: ['./settingsinput.component.sass']
})
export class SettingsinputComponent {


  @Input() ngModel: string;
  @Output() ngModelChange: EventEmitter<any> = new EventEmitter();

  @Input() id: string;

  @Input() set validator(newValidator: SettingsValidator) {
    newValidator.result.resultChanged.subscribe(whatChanged => {
      if (whatChanged === this.id) {
        const message = (newValidator.getMessage(this.id));
        if (message) {
          this.validationError = this.localizationService.l18n(message.message, [message.objectName]);
        }
      }
    })
  }

  public validationError: string;


  constructor(private localizationService: LocalizationService) {

  }

  doChange($event): void {
    this.ngModelChange.emit($event.target.value);
  }
}
