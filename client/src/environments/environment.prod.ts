import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
  production: true,
  api: `http://${window.location.hostname}:9874/api`,
  logLevel: NgxLoggerLevel.ERROR
};

//api: `${window.location.protocol}${window.location.hostname}:${window.location.port}/api`,
