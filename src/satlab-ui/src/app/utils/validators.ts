import {IBuildSelectFields} from '../models/selectable_item';

export function checkSelectFields(fields: IBuildSelectFields) {
  return Object.entries(fields).reduce((p, [_, v]) => p && v !== '', true);
}
