import {ICustomSettings, IDims} from './run_suite_fields';

export type isSuiteTestPlan = 'suite' | 'test' | 'testplan' | '';

export type Suite = {
  kind: 'suite';
  name: string;
};

export type Test = {
  kind: 'test';
  name: string;
  args?: string;
};

export type Testplan = {
  kind: 'testplan';
  name: string;
};

export type Tags =
  | 'tagsToInclude'
  | 'tagsToExclude'
  | 'testNamesInclude'
  | 'testNamesExclude';

type CommonFields = {
  board: string;
  build: string;
  run: Suite | Test | Testplan;
  pool: string;

  dims?: IDims;
  tags?: Partial<Record<Tags, string[]>>;
  advanceSettings: ICustomSettings;
  userDefinedFilter?: string[];
};

export type RunChromeOSRequest = {
  os: 'chromeos';
  model: string;
  milestone: string;
} & CommonFields;

export type RunAndroidOSRequest = {
  os: 'android';
  model?: string;
  target: string;
} & CommonFields;
