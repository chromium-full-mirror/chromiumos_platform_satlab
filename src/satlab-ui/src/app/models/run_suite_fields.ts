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

export type NumberKeys = 'maxInShard' | 'ctpTimeout' | 'trTimeout' | 'nShards';
export type BooleanKeys =
  | 'cft'
  | 'trv2'
  | 'uploadToCpcon'
  | 'extraTestFilter'
  | 'editTopology'
  | 'servoRequired'
  | 'testArgs'
  | 'skipBootPrerequisite';

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

export type SettingKey = NumberKeys | 'shardingMode' | 'default';

export type SettingFormat = 'inputBox' | 'singleChoice' | 'none';

interface BaseSetting {
  key: SettingKey;
  label: string;
  format: SettingFormat;
}

export interface InputBoxSetting extends BaseSetting {
  key: NumberKeys;
  format: 'inputBox';
  state: {
    value: number | null;
    disabled: boolean;
  };
  description?: string;
  // validator accepts number or null, and returns error message
  validator?: (value: number | null) => string;
}

export interface DefaultSetting extends BaseSetting {
  key: 'default';
  format: 'none';
  state: {
    value: null;
    disabled: boolean;
  };
}

export interface SingleChoiceSetting extends BaseSetting {
  key: 'shardingMode';
  format: 'singleChoice';
  index: number;
  options: (InputBoxSetting | DefaultSetting)[];
}

export type CustomSetting =
  | InputBoxSetting
  | DefaultSetting
  | SingleChoiceSetting;

type InputBoxConfig = Omit<InputBoxSetting, 'format'>;

export const createInputBox = (config: InputBoxConfig): InputBoxSetting => ({
  ...config,
  format: 'inputBox',
});

export const getDefaultCTPTimeout = () =>
  createInputBox({
    key: 'ctpTimeout',
    label: 'Overall Timeout (hrs)',
    state: {
      value: 16,
      disabled: false,
    },
    validator: positiveIntegerValidator,
  });

export const getDefaultTrTimeout = () =>
  createInputBox({
    key: 'trTimeout',
    label: 'Single shard (test runner) timeout (hrs)',
    state: {
      value: 16,
      disabled: false,
    },
    validator: positiveIntegerValidator,
  });

export const getDefaultMaxInShards = () =>
  createInputBox({
    key: 'maxInShard',
    label: 'Dynamic',
    state: {
      value: null,
      disabled: false,
    },
    validator: minMaxValidator(0, 65536),
    description: 'Maximum number of test modules in one shard',
  });

export const getDefaultNShards = () =>
  createInputBox({
    key: 'nShards',
    label: 'Static',
    state: {
      value: null,
      disabled: false,
    },
    description: 'Number of shards',
    validator: positiveIntegerValidator,
  });

export const getDefaultNone = (): DefaultSetting => ({
  key: 'default',
  label: 'Default',
  format: 'none',
  state: {
    value: null,
    disabled: false,
  },
});

export const getShardingGroup = (): SingleChoiceSetting => ({
  key: 'shardingMode',
  format: 'singleChoice',
  label: 'Sharding',
  index: 0,
  options: [getDefaultNone(), getDefaultMaxInShards(), getDefaultNShards()],
});

export const getTestplanMaxInShards = () =>
  createInputBox({
    key: 'maxInShard',
    label: 'Dynamic',
    state: {
      value: 10000,
      disabled: true,
    },
    description: 'Maximum number of test modules in one shard',
  });

export const getTestplanShardingGroup = (): SingleChoiceSetting => ({
  key: 'shardingMode',
  format: 'singleChoice',
  label: 'Sharding',
  index: 0,
  options: [getDefaultNone(), getTestplanMaxInShards(), getDefaultNShards()],
});

export const minMaxValidator = (min: number, max: number) => {
  return (value: number): string => {
    if (value < min || value > max) {
      return `Value must be between ${min} and ${max}.`;
    }
    return '';
  };
};

export const positiveIntegerValidator = (value: number | null): string => {
  if (value !== null && value < 1) {
    return 'Value must be a positive integer.';
  }
  return '';
};
