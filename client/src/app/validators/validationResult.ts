import { EventEmitter } from "@angular/core";


export interface ValidationResult {
  isValid: boolean;
  messages: ValidationMessage[];
  resultChanged: EventEmitter<string>;
}

export interface ValidationMessage {
  id: string;
  message: string;
  objectName?: string;
}
