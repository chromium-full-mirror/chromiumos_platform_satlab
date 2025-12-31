export interface IBuildSelectFields {
  model: string;
  board: string;
  milestone: string;
  build: string;
  pool: string;
  dims?: IDims;
}

export type DimKey = 'dut_name' | 'label-servo_state';

export type IDims = {
  [K in DimKey]?: string;
};

export const defaultBuildSelectFields: IBuildSelectFields = {
  model: '',
  board: '',
  milestone: '',
  build: '',
  pool: '',
};

export interface IPVSFields {
  bugID: string;
}

export const defaultStorageQualFields: IPVSFields = {
  bugID: '',
};

export interface IQualificationsFields extends IPVSFields {
  dlmSkuID: string;
  isIncrementalRun: boolean;
  suite: string;
}

export const defaultQualificationsFields: IQualificationsFields = {
  bugID: '',
  suite: '',
  dlmSkuID: '',
  isIncrementalRun: false,
};

type NumberKeys = 'maxInShard';
type BooleanKeys =
  | 'cft'
  | 'trv2'
  | 'uploadToCpcon'
  | 'extraTestFilter'
  | 'editTopology'
  | 'servoRequired'
  | 'testArgs';

export type ICustomSettings = {
  [K in NumberKeys]?: number;
} & {
  [K in BooleanKeys]?: boolean;
};

export type OS = 'chromeos' | 'android';

type ChromeOSProvisionFields = {
  board: string;
  model: string;
  pool: string;
  milestone: string;
  build: string;
  hostname: string;
};

type AndroidProvisionFields = {
  board: string;
  model: string;
  pool: string;
  targetType: string;
  build: string;
  hostname: string;
};

export type ProvisionFields = {
  os: OS;
} & ChromeOSProvisionFields &
  AndroidProvisionFields;

export const defaultProvisionFields: ProvisionFields = {
  os: 'chromeos',
  board: '',
  model: '',
  pool: '',
  hostname: '',
  milestone: '',
  build: '',
  targetType: '',
};
