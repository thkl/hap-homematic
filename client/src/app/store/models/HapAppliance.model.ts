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
}
