"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive bg-card p-6 text-center"
    >
      <TriangleAlertIcon
        aria-hidden="true"
        className="size-5 text-destructive"
      />
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
