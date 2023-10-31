import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {INotification} from "../../models/notification";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent {
  @Input() notification: INotification
  @Input() showDismissButton: boolean = false;
  @Output() clicked = new EventEmitter<INotification>();

  /**
   * onDismissClick on dismiss button clicked
   * @protected
   */
  protected onDismissClick() {
    this.clicked.emit(this.notification);
  }
}
