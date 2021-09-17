export interface CCUChannel {
  id: number;
  address: string;
  name: string;
  type: string;
}

export interface CCUDevice {
  device: string;
  name: string;
  type: string;
  channels: CCUChannel[];
}

export interface CCUDeviceLoadingResult {
  devices: CCUDevice[];
}

export interface CCUVariable {
  id: number;
  name: string;
  valuetype: number;
  subtype: number;
}

export interface CCUVariableLoadingResult {
  variables: CCUVariable[];
}

export interface CCURoom {
  id: number;
  name: string;
  channels: [number];
}

export interface CCURoomLoadingResult {
  rooms: CCURoom[];
}

export interface CCUProgram {
  id: number;
  name: string;
}

export interface CCUProgramLoadingResult {
  programs: CCUProgram[];
}
