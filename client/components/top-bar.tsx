"use client";

import { BellIcon, SearchIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const SEARCH_LABEL = "Search";
const SEARCH_TIP = "Search is not available yet";
const BELL_TIP = "Notifications arrive with reminders";
const SESSION_NAME = "Not signed in";

function SearchSlot() {
  return (
    <div
      title={SEARCH_TIP}
      aria-hidden="true"
      className="flex h-8 min-w-0 max-w-64 flex-1 items-center gap-2 rounded-full bg-muted px-3 text-sm text-muted-foreground sm:max-w-xs"
    >
      <SearchIcon className="size-4 shrink-0" />
      <span className="truncate">{SEARCH_LABEL}</span>
    </div>
  );
}

function NotificationsSlot() {
  return (
    <span
      title={BELL_TIP}
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground"
    >
      <BellIcon className="size-4" />
    </span>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2 px-2">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"
            >
              <UserIcon className="size-4" />
            </span>
            <span className="max-w-32 truncate text-muted-foreground sr-only sm:not-sr-only">
              {SESSION_NAME}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled>Profile</DropdownMenuItem>
        <DropdownMenuItem disabled>Logout</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <div className="px-1.5 pb-1.5">
            <ThemeToggle />
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 md:px-4">
      <SidebarTrigger />
      <SearchSlot />
      <div className="ml-auto flex items-center gap-1">
        <NotificationsSlot />
        <UserMenu />
      </div>
    </header>
  );
}

export { TopBar };
