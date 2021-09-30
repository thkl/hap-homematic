export interface CPUCore {
  model: string,
  speed: number
  times: any
}

export interface SystemConfig {
  cpu?: CPUCore[],
  mem?: number,
  uptime?: number,
  hapuptime?: number,
  version?: string,
  update?: string,
  debug?: boolean,
  forceRefresh?: boolean,
  useAuth?: boolean,
  useTLS?: boolean,
  enableMonitoring?: boolean,
  disableHistory?: boolean,
  forceCache?: boolean,
  interfaceWatchdog?: boolean,
  isEmpty?: boolean
}
