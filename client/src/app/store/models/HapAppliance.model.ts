import { HapApplianceService } from ".";

export enum HapApplicanceType {
  Device = 'HapDevice',
  Variable = 'HapVariable',
  Program = 'HapProgram',
  Special = 'HapSpecial'
}

export interface HapAppliance {
  UUID?: string;
  name: string;
  interface?: string;
  serial: string;
  channel: string;
  address?: string;
  instanceID?: string;
  serviceClass: string;
  settings: any;
  isPublished: boolean;
  nameInCCU: string;
  instanceNames: string;
  isTemporary: boolean;
  applianceType: HapApplicanceType;
}

export interface HapAppllianceApiCallResult {
  appliances: HapAppliance[];
  varTrigger: string;
  varServices: HapApplianceService[];
}
