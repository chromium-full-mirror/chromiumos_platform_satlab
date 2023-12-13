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
    },
    {
      route: '/run_tests',
      label: 'Run Tests',
      icon: 'play_arrow',
    },
    {
      route: '/storage_qualification',
      label: 'PVS',
      icon: 'science',
    },

    {
      route: 'view_jobs',
      label: 'View Jobs',
      icon: 'visibility',
    },
    {
      route: '/configuration',
      label: 'Configuration',
      icon: 'settings',
      disabled: false,
    },
    {
      route: '/about',
      label: 'About',
      icon: 'info',
      disabled: false,
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
