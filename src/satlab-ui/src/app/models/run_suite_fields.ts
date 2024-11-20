export interface IBuildSelectFields {
  model: string;
  board: string;
  milestone: string;
  build: string;
  pool: string;
  dims?: IDims;
}

export type DimKey = 'dut_name';

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

export interface IAdvancedSettings {
  cft: boolean;
  trv2: boolean;
  uploadToCpcon: boolean;
}

export const defaultAdvancedSettings: IAdvancedSettings = {
  cft: true,
  trv2: false,
  uploadToCpcon: false,
};
