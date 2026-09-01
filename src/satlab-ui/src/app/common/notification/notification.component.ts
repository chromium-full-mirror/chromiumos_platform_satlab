import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {INotification, IStringNode, IURLNode} from '../../models/notification';
import {toIterator} from '../../utils/iterator';

@Component({
    selector: 'app-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    standalone: false
})
export class NotificationComponent implements OnInit {
  @Input() notification: INotification;
  @Input() showDismissButton: boolean = true;
  @Output() clicked = new EventEmitter<INotification>();

  protected notifications: (IURLNode | IStringNode)[] = [];

  ngOnInit() {
    if (typeof this.notification.message === 'string') {
      this.notifications = [{type: 'string', value: this.notification.message}];
    } else if (this.__isINode(this.notification.message)) {
      this.notifications = [this.notification.message];
    } else if (this.__isStringNode(this.notification.message)) {
      this.notifications = [this.notification.message];
    } else {
      this.notifications = toIterator(this.notification.message)
        .map(e => {
          if (typeof e === 'string') {
            const p: IStringNode = {
              type: 'string',
              value: e,
            };
            return p;
          }
          return e;
        })
        .collect();
    }
  }

  /**
   * onDismissClick on dismiss button clicked
   * @protected
   */
  protected onDismissClick() {
    this.clicked.emit(this.notification);
  }

  private __isINode(x: unknown): x is IURLNode {
    return typeof x === 'object' && 'type' in x && x.type === 'url';
  }

  private __isStringNode(x: unknown): x is IStringNode {
    return typeof x === 'object' && 'type' in x && x.type === 'string';
  }
}
