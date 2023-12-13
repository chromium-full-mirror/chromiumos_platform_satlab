import {IBuildSelectFields} from '../models/run_suite_fields';

export function checkSelectFields(fields: IBuildSelectFields) {
  return Object.entries(fields).reduce((p, [_, v]) => p && v !== '', true);
}
