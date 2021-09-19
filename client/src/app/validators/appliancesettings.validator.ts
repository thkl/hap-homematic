import { HapAppliance, HapApplianceService } from "../store/models";
import { ValidationResult } from "./validationResult";
import { SettingsValidator } from "./validator";

export class ApplianceValidator extends SettingsValidator {


  validate(appliance: HapAppliance,
    selectedService: HapApplianceService): ValidationResult {
    this.result.messages = [];

    if ((appliance.name === undefined) || (appliance.name.length === 0)) {
      this.result.messages.push({ id: 'appliance_name', message: 'Appliance must have a name' });
      this.result.resultChanged.emit('appliance_name');
    }

    if ((appliance.instanceID === undefined)) {
      this.result.messages.push({ id: 'appliance_instance', message: 'Appliance must have a Instance' });
      this.result.resultChanged.emit('appliance_instance');
    }


    // check the settings
    const settingsKeys = Object.keys(selectedService.settings);
    settingsKeys.forEach(key => {
      const setting = selectedService.settings[key];
      // check numbers
      if (setting.type === 'number') {
        if ((appliance.settings.settings[key] !== undefined) && (isNaN(appliance.settings.settings[key]))) {
          const id = `service_prop_${key}`;
          this.result.messages.push({ id, message: '%s must be a number', objectName: setting.label });
          this.result.resultChanged.emit(id);

        }
      }

      // check mandatory fields
      if ((setting.mandatory) && (setting.mandatory === true)) {
        if (appliance.settings.settings[key] === undefined) {
          const id = `service_prop_${key}`;
          this.result.messages.push({ id, message: '%s must be a specified', objectName: setting.label });
          this.result.resultChanged.emit(id);
        }
      }
    });

    this.result.isValid = (this.result.messages.length === 0);

    return this.result;
  }
}
