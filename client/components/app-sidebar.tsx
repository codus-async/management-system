"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { isNavItemDisabled, NAV_SECTIONS, type NavItem } from "@/lib/nav";

function NavItemRow({ item }: { item: NavItem }) {
  const Icon = item.icon;

  if (isNavItemDisabled(item)) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          aria-disabled
          title={`${item.label} is not available yet`}
        >
          <Icon aria-hidden="true" />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={item.href} />}>
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppSidebar({ className }: { className?: string }) {
  return (
    <Sidebar collapsible="icon" className={className} aria-label="Sections">
      <SidebarHeader>
        <Button
          variant="ghost"
          disabled
          className="h-8 justify-start gap-2 px-2 font-medium"
        >
          <span className="flex size-5 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
            CP
          </span>
          <span className="truncate">CEO PA</span>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavItemRow key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
