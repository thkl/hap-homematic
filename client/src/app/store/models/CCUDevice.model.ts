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
