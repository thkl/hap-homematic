import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
  production: true,
  api: `${window.location.protocol}${window.location.hostname}:${window.location.port}/api`,
  logLevel: NgxLoggerLevel.ERROR
};
