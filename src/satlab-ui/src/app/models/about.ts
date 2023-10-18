export interface ISystemInfo {
  cpuTemperature: number;
  startTime?: Date;
}

export interface IVersionInfo {
  version: string;
  chromeosVersion: string;
  track: string;
  description: string;
  hostId: string;
}

export interface INetworkInfo {
  hostname: string;
  macAddress: string;
  isConnectedToInternet: boolean;
}

export interface ILinkInfo {
  name: string;
  url: string;
}
