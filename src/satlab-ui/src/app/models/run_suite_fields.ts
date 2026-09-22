import {Test, Testplan} from './run';

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
  | 'skipBootPrerequisite'
  | 'useSignedImage'
  | 'useTestRamdisk'
  | 'useSatlabCache'
  | 'primaryAbiOnly';

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

export type SettingKey = NumberKeys | BooleanKeys | 'shardingMode' | 'default';

export type SettingFormat = 'inputBox' | 'singleChoice' | 'checkbox' | 'none';

interface BaseSetting {
  key: SettingKey;
  label: string;
  format: SettingFormat;
  description?: string;
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
    value: number | null;
    disabled: boolean;
  };
}

export interface SingleChoiceSetting extends BaseSetting {
  key: 'shardingMode';
  format: 'singleChoice';
  index: number;
  options: (InputBoxSetting | DefaultSetting)[];
}

export interface CheckboxSetting extends BaseSetting {
  key: BooleanKeys;
  format: 'checkbox';
  state: {
    value: boolean;
    disabled: boolean;
  };
  description?: string;
}

export type CustomSetting =
  | InputBoxSetting
  | DefaultSetting
  | SingleChoiceSetting
  | CheckboxSetting;

type InputBoxConfig = Omit<InputBoxSetting, 'format'>;

export const createInputBox = (config: InputBoxConfig): InputBoxSetting => ({
  ...config,
  format: 'inputBox',
});

type CheckboxConfig = Omit<CheckboxSetting, 'format'>;

export const createCheckbox = (config: CheckboxConfig): CheckboxSetting => ({
  ...config,
  format: 'checkbox',
});

export const getDefaultUseSignedImage = () =>
  createCheckbox({
    key: 'useSignedImage',
    label: 'Use signed image',
    state: {
      value: false,
      disabled: false,
    },
    description: 'Use signed image during provisioning',
  });

export const getDefaultUseTestRamdisk = () =>
  createCheckbox({
    key: 'useTestRamdisk',
    label: 'Use test ramdisk',
    state: {
      value: false,
      disabled: false,
    },
    description: 'Use test ramdisk during provisioning',
  });

export const getDefaultUseSatlabCache = () =>
  createCheckbox({
    key: 'useSatlabCache',
    label: 'Use satlab cache',
    state: {
      value: false,
      disabled: false,
    },
    description: 'Use satlab cache for AB downloads',
  });

export const getDefaultPrimaryAbiOnly = () =>
  createCheckbox({
    key: 'primaryAbiOnly',
    label: 'Primary ABI only',
    state: {
      value: true,
      disabled: false,
    },
    description: 'Uncheck to allow running tests on non-primary ABI',
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

export const getTestplanDefault = (): DefaultSetting => ({
  key: 'default',
  label: 'Default',
  format: 'none',
  state: {
    value: 10000,
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
  options: [
    getTestplanDefault(),
    getTestplanMaxInShards(),
    getDefaultNShards(),
  ],
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

export interface ALBuildBasic {
  branch: string;
  target: string;
  build: string;
}

export interface DefaultALProvisionFields {
  mode: 'DEFAULT';
  value: ALBuildBasic;
}

export interface SkipALProvisionFields {
  mode: 'SKIP';
}

export type ALProvisionOptions =
  | DefaultALProvisionFields
  | SkipALProvisionFields;

export type AndroidBuildBasicFields = {
  mode: 'ANDROID_BUILD';
  buildValues: ALBuildBasic;
};

export type GoogleDriveBasicFields = {
  mode: 'GOOGLE_DRIVE';
  zipFileId: string;
};

export type ALTestingOptions = AndroidBuildBasicFields | GoogleDriveBasicFields;

export type ALTestingBasicFields =
  | AndroidBuildBasicFields
  | GoogleDriveBasicFields;

export type ALTestingOptionsSuiteTest = {
  suite?: string;
  testModules?: string[];
};

export type ALTestingOptionsTestplan = {
  planName: string;
};

export type TestSelection =
  | ALTestingOptionsSuiteTest
  | ALTestingOptionsTestplan
  | null;

export type GoogleDriveFile = {
  id: string;
  name: string;
};

export const MEMORY_TESTPLAN_NAME = 'avs/component/memory' as const;
export const STORAGE_TESTPLAN_NAME = 'avs/component/storage' as const;

export type MemoryTest = Testplan & {name: typeof MEMORY_TESTPLAN_NAME};
export type StorageTest =
  | (Testplan & {name: typeof STORAGE_TESTPLAN_NAME})
  | Test;
export type AVLTestplan = MemoryTest | StorageTest;
