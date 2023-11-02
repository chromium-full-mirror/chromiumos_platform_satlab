import {Component} from '@angular/core';
import {SidebarEntry} from '../models/feature';
import {NotificationService} from "../services/notification.service";
import {INotification} from "../models/notification";
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.scss'],
})
export class AppSidebarComponent {
  protected navTabs: SidebarEntry[] = [
    {
      route: '/manage_duts',
      label: 'Manage DUTs'
    },
    {
      route: '/run_tests',
      label: 'Run Suite',
    },
    {
      route: '/configuration',
      label: 'Configuration',
      disabled: false,
    },
    {
      route: '/about',
      label: 'About',
      disabled: false,
    },
  ];

  constructor(
    public notificationService: NotificationService,
    protected auth: AuthService,
  ) {}

  protected trackNotification(_, n: INotification) {
    return n.id;
  }

  protected dismiss(n: INotification) {
    this.notificationService.dismiss(n.id)
  }
}
