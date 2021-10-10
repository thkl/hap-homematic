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
  interfaceWatchdog?: number,
  isEmpty?: boolean,
  runtimeID?: string
}

export interface ChangeLogVersion {
  descriptions: string[],
  issues: string[]
}

export interface ChangeLog {
  versions: { [key: string]: ChangeLogVersion },
  latest: string
}
