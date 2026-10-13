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
    label: "Sections",
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
