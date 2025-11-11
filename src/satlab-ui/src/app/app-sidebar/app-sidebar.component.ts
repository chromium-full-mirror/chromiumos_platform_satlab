import {SidebarEntry} from '../models/feature';
import {INotification} from '../models/notification';
import {AuthService} from '../services/auth.service';
import {NotificationService} from '../services/notification.service';
import {UpdateService} from '../services/update.service';
import {Component} from '@angular/core';

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
      route: 'view_jobs',
      label: 'View Jobs',
      icon: 'visibility',
      outlined: false,
    },
    {
      route: '',
      label: 'ChromeOS',
      icon: 'chevron_right',
      outlined: false,
      children: [
        {
          route: '/run_tests/chromeos',
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
          route: '/faft',
          label: 'FAFT',
          icon: 'developer_board',
          outlined: false,
        },
      ],
      showChildren: false,
    },
    {
      route: '',
      label: 'Android',
      icon: 'chevron_right',
      outlined: false,
      children: [
        {
          route: '/run_tests/android',
          label: 'Run Tests',
          icon: 'play_arrow',
          outlined: false,
        },
        {
          route: 'run_tests/android/labqual',
          label: 'Labqual',
          icon: 'labs',
          outlined: true,
        },
      ],
      showChildren: false,
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

  protected chromeChildShow = false;

  constructor(
    public notificationService: NotificationService,
    protected auth: AuthService,
    protected updateService: UpdateService
  ) {}

  protected trackNotification(_, n: INotification) {
    return n.id;
  }

  protected dismiss(n: INotification) {
    this.notificationService.dismiss(n.id);
  }

  protected onToggleChildClicked(label: string) {
    const tab = this.navTabs.find(t => t.label === label);
    if (!tab) {
      return;
    }
    tab.showChildren = !tab.showChildren;
  }
}
