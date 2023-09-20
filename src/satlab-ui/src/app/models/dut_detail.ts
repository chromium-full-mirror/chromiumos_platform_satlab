export interface IDUTDetail {
  botId: string;
  taskId: string;
  externalIP: string;
  authenticatedAs: string;
  firstSeen?: Date;
  isDead: boolean;
  lastSeen?: Date;
  quarantined: boolean;
  maintenanceMsg: string;
  taskName: string;
  version: string;
  dimensions: IkeyPairs[];
}

export interface IkeyPairs {
  key: string;
  values: string[];
}
