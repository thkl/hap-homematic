import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
  production: true,
  api: `${window.location.protocol}//${window.location.hostname}:9874/api`,
  logLevel: NgxLoggerLevel.ERROR,
  wsEndpoint: `//${window.location.hostname}:9874/websockets`
};

