export interface HapApplianceServiceResponse {
  service: HapApplianceService[];
}

export interface HapApplianceService {
  serviceClazz: string;
  priority: number;
  description: string;
  settings: { [key: string]: any };
}
