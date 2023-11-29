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
  private __n = new BehaviorSubject<INotification[]>([]);
  public notification$: Observable<INotification[]>;

  constructor() {
    this.notification$ = this.__n.asObservable();
  }

  /**
   * notify the message in the UI.
   * @param message the message we want to show
   * @param options the options of control dismiss a message.
   * Otherwise, it will keep on the UI.
   */
  public info(
    message: NotificationNodes,
    options: {ms?: number; dismiss: boolean} = {ms: 5000, dismiss: true}
  ) {
    const n = this.__addAndEmit(message, 'info');
    this.__dismiss(n.id, options);
  }

  /**
   * notify the error message in the UI.
   * @param e the error
   * @param options the options of control dismiss a message.
   * Otherwise, it will keep on the UI.
   */
  public error(
    e: unknown,
    options: {ms?: number; dismiss: boolean} = {ms: 5000, dismiss: true}
  ) {
    let s: string;
    if (typeof e === 'string') {
      s = e;
    } else if (
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
    ) {
      s = e.message;
    }

    if (s) {
      const n = this.__addAndEmit(s, 'error');
      this.__dismiss(n.id, options);
    }
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
