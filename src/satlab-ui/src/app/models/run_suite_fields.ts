export interface IBuildSelectFields {
  model: string;
  board: string;
  milestone: string;
  build: string;
  pool: string;
}

export const defaultBuildSelectFields: IBuildSelectFields = {
  model: '',
  board: '',
  milestone: '',
  build: '',
  pool: '',
};

export interface IStorageQualFields {
  bugID: string;
  suite: string;
}

export const defaultStorageQualFields: IStorageQualFields = {
  bugID: '',
  suite: '',
};
