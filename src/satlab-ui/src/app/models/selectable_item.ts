interface ISelectableItem {
  text: string;
  value: unknown;
  label: string;
}

export interface IRecommendedItem extends ISelectableItem {
  label: 'Recommended';
}

export interface IFailedItem extends ISelectableItem {
  label: 'Failed';
}

export interface IRunningItem extends ISelectableItem {
  label: 'Running';
}

export interface IAbortedItem extends ISelectableItem {
  label: 'Aborted';
}

export interface IItem extends ISelectableItem {
  label: '';
}

export type SelectableItem =
  | IRecommendedItem
  | IFailedItem
  | IItem
  | IRunningItem
  | IAbortedItem;

export type BuildStatus = '' | 'Failed' | 'Running' | 'Aborted' | 'Recommended';

export const BUILD_STATUS_MAPPINGS: {
  [key: number]: BuildStatus;
} = {
  0: '',
  1: 'Failed',
  2: 'Running',
  3: 'Aborted',
  4: 'Recommended',
};

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
