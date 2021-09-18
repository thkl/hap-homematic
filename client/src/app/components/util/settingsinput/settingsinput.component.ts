import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { LocalizationService } from 'src/app/service/localization.service';
import { ApplianceValidator } from 'src/app/validators/appliancesettings.validator';

@Component({
  selector: 'settingsinput',
  templateUrl: './settingsinput.component.html',
  styleUrls: ['./settingsinput.component.sass']
})
export class SettingsinputComponent implements AfterViewInit {


  @Input() value: string;
  @Input() id: string;
  @Input() validator: ApplianceValidator;

  public validationError: string;
  @Output() change: EventEmitter<any> = new EventEmitter();

  constructor(private localizationService: LocalizationService) {

  }

  ngAfterViewInit(): void {
    this.validator.result.resultChanged.subscribe(whatChanged => {
      if (whatChanged === this.id) {
        const message = (this.validator.getMessage(this.id));
        if (message) {
          this.validationError = this.localizationService.l18n(message.message, [message.objectName]);
        }
      }
    })
  }



  doChange($event): void {
    this.change.emit($event);
  }
}
