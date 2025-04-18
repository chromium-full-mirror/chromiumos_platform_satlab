import {Component} from '@angular/core';
import {SidebarEntry} from '../models/feature';
import {NotificationService} from '../services/notification.service';
import {INotification} from '../models/notification';
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
      label: 'Manage DUTs',
      icon: 'devices',
      outlined: false,
    },
    {
      route: '/run_tests',
      label: 'Run Tests',
      icon: 'play_arrow',
      outlined: false,
    },
    {
      route: '/pasit',
      label: 'Pasit',
      icon: 'hub',
      outlined: false,
    },
    {
      route: '/pvs',
      label: 'AVL Qualification',
      icon: 'science',
      outlined: false,
    },
    {
      route: '/labqual',
      label: 'Labqual',
      icon: 'labs',
      outlined: true,
    },
    {
      route: 'view_jobs',
      label: 'View Jobs',
      icon: 'visibility',
      outlined: false,
    },
    {
      route: '/configuration',
      label: 'Configuration',
      icon: 'settings',
      disabled: false,
      outlined: false,
    },
    {
      route: '/about',
      label: 'About',
      icon: 'info',
      disabled: false,
      outlined: false,
    },
  ];

  constructor(
    public notificationService: NotificationService,
    protected auth: AuthService
  ) {}

  protected trackNotification(_, n: INotification) {
    return n.id;
  }

  protected dismiss(n: INotification) {
    this.notificationService.dismiss(n.id);
  }
}
