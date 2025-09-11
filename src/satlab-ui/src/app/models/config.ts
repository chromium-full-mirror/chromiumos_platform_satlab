import {Tags} from './run';

export type TestConfig = (
  | {
      kind: 'test';
      name: string;
      testArgs?: string;
    }
  | {kind: 'suite'}
) &
  Partial<Record<Tags, string[]>>;

export const faftRunConfig: Record<string, TestConfig> = {
  faft_bios_autotests: {
    kind: 'suite',
  },
  faft_bios_rw: {
    kind: 'suite',
    tagsToInclude: ['group:firmware', 'firmware_bios_rw||firmware_bios_pdc'],
    tagsToExclude: ['firmware_pd'],
  },
  faft_bios_ro_rw: {
    kind: 'suite',
    tagsToInclude: [
      'group:firmware',
      'firmware_bios_rw||firmware_bios_ro||firmware_bios_pdc',
    ],
    tagsToExclude: ['firmware_pd'],
  },
  faft_ec: {
    kind: 'suite',
    tagsToInclude: ['group:firmware', 'firmware_ec_ro||firmware_ec_rw'],
    tagsToExclude: [
      'firmware_pd',
      'firmware_bios_ro',
      'firmware_bios_rw',
      'firmware_bios_pdc',
    ],
  },
  faft_ec_bios: {
    kind: 'suite',
    tagsToInclude: ['group:firmware', 'firmware_ec_ro||firmware_ec_rw'],
    tagsToExclude: ['firmware_pd'],
  },
  faft_pd: {
    kind: 'suite',
    tagsToInclude: [
      'group:firmware',
      'firmware_pd||firmware_bios_ro||firmware_bios_rw||firmware_bios_pdc||firmware_ec_ro||firmware_ec_rw',
    ],
  },
  faft_emmc_ssd: {
    kind: 'suite',
    testNamesInclude: ['tast.storage.QuickStress.*'],
  },
  faft_suspend_endurance: {
    kind: 'test',
    name: 'tast.firmware.SuspendStress.fw_qual',
    testArgs: 'firmware_consecutiveBootIters=2500',
  },
  faft_reboot_endurance_norm: {
    kind: 'test',
    name: 'tast.firmware.ConsecutiveBoot.shutdown_cmd_normal_mode',
    testArgs: 'firmware_consecutiveBootIters=1500',
  },
  faft_reboot_endurance_dev: {
    kind: 'test',
    name: 'tast.firmware.ConsecutiveBoot.shutdown_cmd_dev_mode',
    testArgs: 'firmware_consecutiveBootIters=500',
  },
};
