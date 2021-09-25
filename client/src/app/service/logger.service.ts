import { NGXLoggerMonitor, NGXLogInterface } from "ngx-logger";

export class ConsoleLoggerMonitor implements NGXLoggerMonitor {
  onLog(log: NGXLogInterface) {
    console.log("[Client]", log);
  }
}
