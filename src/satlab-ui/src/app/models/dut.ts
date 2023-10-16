export interface ISimpleDUT {
  model: string;
  board: string;
  pools: string[];
}

export  interface IDut {
  address: string;
  name: string;
  hostname: string;
  board: string;
  model: string;
  pools: string[];
  poolString: string;
  mac: string;
  isConnected: boolean;
}
