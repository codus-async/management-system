import { cn } from "cn";

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md bg-primary font-heading text-base font-medium text-primary-foreground group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:text-sm",
        className,
      )}
    >
      CP
    </span>
  );
}

function BrandName({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "truncate font-heading text-base leading-tight font-medium",
        className,
      )}
    >
      CEO PA
    </span>
  );
}

export { BrandMark, BrandName };
