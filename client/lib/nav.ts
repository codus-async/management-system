import type { LucideIcon } from "lucide-react";
import {
  CalendarDaysIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  PhoneCallIcon,
  UsersIcon,
} from "lucide-react";

export type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly disabled?: boolean;
};

export type NavSection = {
  readonly label: string;
  readonly items: readonly NavItem[];
};

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: "Today",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
        disabled: true,
      },
      {
        label: "Schedule",
        href: "/schedule",
        icon: CalendarDaysIcon,
        disabled: true,
      },
      { label: "Tasks", href: "/tasks", icon: ListTodoIcon, disabled: true },
    ],
  },
  {
    label: "Office",
    items: [
      {
        label: "Contacts",
        href: "/contacts",
        icon: UsersIcon,
        disabled: true,
      },
      {
        label: "Follow ups",
        href: "/follow-ups",
        icon: PhoneCallIcon,
        disabled: true,
      },
      {
        label: "Briefing",
        href: "/briefing",
        icon: FileTextIcon,
        disabled: true,
      },
    ],
  },
];

export function isNavItemDisabled(item: NavItem): boolean {
  return item.disabled === true;
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (isNavItemDisabled(item)) return false;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function hasDisabledNavItems(sections: readonly NavSection[]): boolean {
  return sections.some((section) => section.items.some(isNavItemDisabled));
}
