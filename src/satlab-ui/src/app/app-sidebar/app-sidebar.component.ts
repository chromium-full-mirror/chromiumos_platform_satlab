import {Component} from '@angular/core';
import {SidebarEntry} from '../models/feature';

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
      route: '/about',
      label: 'About',
    },
  ];

  constructor() {}
}
