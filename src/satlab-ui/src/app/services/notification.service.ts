import {Injectable} from '@angular/core';
import {
  createNotification,
  INotification,
  NotificationNodes,
} from '../models/notification';
import {BehaviorSubject, Observable, timer} from 'rxjs';
import {toIterator} from '../utils/iterator';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  public notification$: Observable<INotification[]>;
  private __n = new BehaviorSubject<INotification[]>([]);

  constructor() {
    this.notification$ = this.__n.asObservable();
  }

  /**
   * notify the message in the UI.
   * @param message the message we want to show
   * @param options the options of control dismiss a message.
   * Otherwise, it will keep on the UI.
   * @return the notification id.
   */
  public info(
    message: NotificationNodes,
    options: {ms?: number; dismiss: boolean} = {ms: 5000, dismiss: true}
  ): string {
    const n = this.__addAndEmit(message, 'info');
    this.__dismiss(n.id, options);
    return n.id;
  }

  /**
   * notify the error message in the UI.
   * @param e the error
   * @param options the options of control dismiss a message.
   * Otherwise, it will keep on the UI.
   * @return the notification id, or empty string if e could not be formatted.
   */
  public error(
    e: unknown,
    options: {ms?: number; dismiss: boolean} = {ms: 5000, dismiss: true}
  ): string {
    let s = '';
    if (typeof e === 'string') {
      s = e;
    } else if (
      typeof e === 'object' &&
      e !== null &&
      'message' in e &&
      typeof e.message === 'string'
    ) {
      s = e.message;
    }

    if (s) {
      const n = this.__addAndEmit(s, 'error');
      this.__dismiss(n.id, options);
      return n.id;
    }
    return '';
  }

  /**
   * Returns true if a notification with the given id is currently visible.
   */
  has(id: string): boolean {
    if (!id) {
      return false;
    }
    return this.__n.value.some(e => e.id === id);
  }

  /**
   * Replaces an active notification in place by id if it has not been dismissed.
   * Returns the new notification id, or null if the original id was already gone.
   */
  replace(
    id: string,
    message: NotificationNodes,
    options: {
      type?: INotification['type'];
      ms?: number;
      dismiss?: boolean;
    } = {}
  ): string | null {
    if (!id) {
      return null;
    }
    const idx = this.__n.value.findIndex(e => e.id === id);
    if (idx === -1) {
      return null;
    }
    const existing = this.__n.value[idx];
    const replacement = createNotification(
      message,
      options.type ?? existing.type
    );
    const notifications = [...this.__n.value];
    notifications[idx] = replacement;
    this.__n.next(notifications);
    this.__dismiss(replacement.id, {
      ms: options.ms,
      dismiss: options.dismiss ?? true,
    });
    return replacement.id;
  }

  /**
   * dismiss the message by given id.
   * @param id the notification id
   */
  public dismiss(id: string) {
    const notifications = toIterator(this.__n.value)
      .filter(e => e.id !== id)
      .collect();
    this.__n.next(notifications);
  }

  /**
   * __dismiss a function controls how to dismiss the message.
   * @param id the id of notification.
   * @param options the options of control dismiss a message. default delay time is 5s.
   * @private
   */
  private __dismiss(
    id: string,
    options: {ms?: number; dismiss: boolean} = {ms: 5000, dismiss: true}
  ) {
    if (options.dismiss) {
      this.__delayDismiss(id, options.ms ?? 5000);
    }
  }

  /**
   * __addAndEmit add the notification and notify other components
   * that listen to it.
   * @param message the message
   * @param type the type of notification.
   * @private
   */
  private __addAndEmit(
    message: NotificationNodes,
    type: INotification['type']
  ) {
    const n = createNotification(message, type);
    const notifications = [...this.__n.value, n];
    this.__n.next(notifications);
    return n;
  }

  /**
   * __delayDismiss after the given ms and then dismiss the message by given id
   * @param id the notification id
   * @param ms the delay time (the unit is ms)
   * @private
   */
  private __delayDismiss(id: string, ms: number) {
    // emit after the given seconds and complete.
    timer(ms).subscribe(_ => this.dismiss(id));
  }
}
