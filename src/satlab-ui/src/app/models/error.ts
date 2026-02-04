export const validateProvisionBuildKey = `build-picker-provision ValidateBuild`;
export const invalidProvisionBuildMsg = `OS build is not valid`;
export const validateTestBuildKey = `build-picker-test ValidateBuild`;
export const invalidTestBuildMsg = `Test build is not valid`;

export const listProvisionBranchKey = `build-picker-provision ListBranch`;
export const noProvisionBranchMsg = `No OS branch available`;
export const listTestBranchKey = `build-picker-test ListBranch`;
export const noTestBranchMsg = `No test branch available`;

export const listProvisionBuildKey = `build-picker-provision ListBuild`;
export const noProvisionBuildMsg = `No OS build available`;
export const listTestBuildKey = `build-picker-test ListBuild`;
export const noTestBuildMsg = `No test build available`;

export const listProvisionTargetKey = `build-picker-provision ListTarget`;
export const noProvisionTargetMsg = `No OS target available`;
export const listTestTargetKey = `build-picker-test ListTarget`;
export const noTestTargetMsg = `No test target available`;

export const commonNoBranchMsg = `No branch available`;
export const commonNoTargetMsg = `No target available`;
export const commonNoBuildMsg = `No build available`;
export const commonInvalidBuildMsg = `Invalid build`;
export const noDutsMsg = `No DUT available`;

export const commonListBranchesKey = `ListBranches`;
export const commonListTargetsKey = `ListTargets`;
export const commonListBuildsKey = `ListBuilds`;
export const commonValidateBuildKey = `ValidateBuild`;
export const listDutsKey = `ListDuts`;

export interface ErrKeyMsgConfig {
  label: string;
  keys: {
    branch: string;
    target: string;
    build: string;
    validate: string;
    listDut?: string;
  };
  msgs: {
    branch: string;
    target: string;
    build: string;
    validate: string;
    listDut?: string;
  };
}

export const ERROR_KEY_MSG_CONFIGS: Record<
  'provision' | 'test' | 'common',
  ErrKeyMsgConfig
> = {
  provision: {
    label: 'OS',
    keys: {
      branch: listProvisionBranchKey,
      target: listProvisionTargetKey,
      build: listProvisionBuildKey,
      validate: validateProvisionBuildKey,
    },
    msgs: {
      branch: noProvisionBranchMsg,
      target: noProvisionTargetMsg,
      build: noProvisionBuildMsg,
      validate: invalidProvisionBuildMsg,
    },
  },
  test: {
    label: 'Test',
    keys: {
      branch: listTestBranchKey,
      target: listTestTargetKey,
      build: listTestBuildKey,
      validate: validateTestBuildKey,
    },
    msgs: {
      branch: noTestBranchMsg,
      target: noTestTargetMsg,
      build: noTestBuildMsg,
      validate: invalidTestBuildMsg,
    },
  },
  common: {
    label: 'Common',
    keys: {
      branch: commonListBranchesKey,
      target: commonListTargetsKey,
      build: commonListBuildsKey,
      validate: commonValidateBuildKey,
      listDut: listDutsKey,
    },
    msgs: {
      branch: commonNoBranchMsg,
      target: commonNoTargetMsg,
      build: commonNoBuildMsg,
      validate: commonInvalidBuildMsg,
      listDut: noDutsMsg,
    },
  },
};
