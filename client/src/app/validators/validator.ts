import { EventEmitter } from "@angular/core";
import { ValidationMessage, ValidationResult } from "./validationResult";

export class SettingsValidator {

  public result: ValidationResult;

  constructor() {
    this.result = { isValid: true, messages: [], resultChanged: new EventEmitter() };
  }


  getMessage(id: string): ValidationMessage {
    return this.result.messages.find(message => (message.id === id));
  }
}
