export type Feature = 'DUT_DETAIL';

export interface SidebarEntry {
  route: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  outlined: boolean;
  children?: SidebarEntry[];
  showChildren?: boolean;
}
