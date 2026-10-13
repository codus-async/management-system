"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark, BrandName } from "@/components/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  hasDisabledNavItems,
  isNavItemActive,
  isNavItemDisabled,
  NAV_SECTIONS,
  type NavItem,
} from "@/lib/nav";

function NavItemRow({ item, pathname }: { item: NavItem; pathname: string }) {
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
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={isNavItemActive(item, pathname)}
        tooltip={item.label}
      >
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const showBuildNote = hasDisabledNavItems(NAV_SECTIONS);

  return (
    <Sidebar collapsible="icon" className={className}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1">
          <BrandMark />
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <BrandName className="text-sidebar-foreground" />
            <span className="truncate text-xs text-sidebar-foreground/70">
              Office of the CEO
            </span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Sections" className="flex min-h-0 flex-1 flex-col">
          {NAV_SECTIONS.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <NavItemRow
                      key={item.href}
                      item={item}
                      pathname={pathname}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      {showBuildNote && (
        <SidebarFooter className="border-t border-border">
          <p className="px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Sections open here as they&rsquo;re built.
          </p>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
