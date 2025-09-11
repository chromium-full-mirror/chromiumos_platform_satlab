import {finalize, Observable} from 'rxjs';
import {SelectableItem} from '../models/selectable_item';
import {untracked, WritableSignal} from '@angular/core';
import {startWithTap} from './rxjs_operator';

export function toSelectedItem(value: string): SelectableItem {
  return {
    label: '',
    value: value,
    text: value,
  };
}

export function wrapperLoading<T>(
  o: Observable<T>,
  loading: WritableSignal<{show: boolean; message: string}>,
  msg: string
) {
  return o.pipe(
    startWithTap(() => {
      loading.set({
        show: true,
        message: msg,
      });
    }),
    finalize(() => {
      loading.set({
        show: false,
        message: '',
      });
    })
  );
}

export function resetSignals(
  signals: WritableSignal<unknown>[],
  defaultValue?: unknown
) {
  if (signals.length > 0) {
    if (defaultValue === undefined) {
      signals.forEach(e => {
        const value = untracked(() => {
          if (defaultValue) {
            return defaultValue;
          }

          if (typeof e() === 'string') {
            return '';
          } else if (Array.isArray(e())) {
            return [];
          } else if (typeof e() === 'object') {
            return {};
          }

          throw Error(`Unknown type of signal: ${typeof e()}`);
        });
        e.set(value);
      });
    }
  }
}
