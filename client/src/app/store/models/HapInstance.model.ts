export interface HapInstance {
  id: string;
  user: string;
  displayName: string;
  pincode?: string;
  setupID?: string;
  roomId: number;
  port?: number;
  setupURI?: string;
  ccuFirewall?: boolean;
  canDelete: boolean;
  iconPin?: string;
}

export interface HapInstanceSavingResult {
  instances: HapInstance[];
}

export interface HapInstanceDeletingResult {
  deleted: string;
  error: string;
}
