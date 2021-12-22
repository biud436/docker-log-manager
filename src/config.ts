import * as config from "../config.json";

export type LogType =
  | "daily"
  | "weekly"
  | "monthly"
  | "minutely"
  | "hourly"
  | "yearly";

export interface ILoggingOption {
  targetFolder: string;
  interval: LogType;
}

export interface IConfig {
  windows: ILoggingOption;
  linux: ILoggingOption;
}

export function getConfig(): ILoggingOption {
  const defaultConfig = config.linux;

  if (process.platform === "linux") {
    return <ILoggingOption>config.linux;
  } else if (process.platform === "win32") {
    return <ILoggingOption>config.windows;
  }
  return <ILoggingOption>defaultConfig;
}
