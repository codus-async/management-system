"use client";

import { SearchIcon, UserIcon } from "lucide-react";
import { BrandMark, BrandName } from "@/components/brand";
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

function SearchSlot() {
  return (
    <div
      title="Search is not available yet"
      className="hidden h-8 w-full min-w-0 max-w-64 flex-1 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm text-muted-foreground sm:flex md:max-w-xs"
    >
      <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">Search</span>
    </div>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Account"
            className="gap-2"
          >
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <UserIcon className="size-3" />
            </span>
            <span className="hidden sm:inline">Account</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Not signed in</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Sign in</DropdownMenuItem>
          <DropdownMenuItem disabled>Profile</DropdownMenuItem>
          <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 md:px-4">
      <SidebarTrigger />
      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <BrandMark />
        <BrandName className="text-foreground" />
      </div>
      <SearchSlot />
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

export { TopBar };
