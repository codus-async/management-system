"use client";

import * as React from "react";
import { CalendarPlusIcon, InboxIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/error-state";

const ROWS = [
  { id: "FU-104", contact: "Ada Nwosu", due: "2 days", status: "Open" },
  { id: "FU-105", contact: "Ben Adeyemi", due: "Today", status: "Due" },
  { id: "FU-106", contact: "Chidi Okafor", due: "5 days", status: "Open" },
];

function LoadingState() {
  return (
    <div
      data-slot="loading-state"
      aria-busy="true"
      aria-label="Loading follow ups"
      className="flex flex-col gap-2"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No follow ups yet</EmptyTitle>
        <EmptyDescription>
          Follow ups appear here once a contact owes you a reply.
        </EmptyDescription>
      </EmptyHeader>
      <Button size="sm" onClick={onCreate}>
        <CalendarPlusIcon aria-hidden="true" />
        Add a follow up
      </Button>
    </Empty>
  );
}

function ReadyState() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="text-right">Due in</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs">{row.id}</TableCell>
            <TableCell>{row.contact}</TableCell>
            <TableCell className="text-right tabular-nums">{row.due}</TableCell>
            <TableCell>
              <Badge
                variant={row.status === "Due" ? "destructive" : "secondary"}
              >
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StateShowcase() {
  const [tab, setTab] = React.useState("ready");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
      <TabsList aria-label="Data state">
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="error">Error</TabsTrigger>
        <TabsTrigger value="ready">Ready</TabsTrigger>
      </TabsList>
      <TabsContent value="loading">
        <LoadingState />
      </TabsContent>
      <TabsContent value="empty">
        <EmptyState onCreate={() => setTab("ready")} />
      </TabsContent>
      <TabsContent value="error">
        <ErrorState
          title="Follow ups could not load"
          description="The request timed out. Nothing was changed."
          onRetry={() => setTab("ready")}
        />
      </TabsContent>
      <TabsContent value="ready">
        <ReadyState />
      </TabsContent>
    </Tabs>
  );
}

export { StateShowcase };
