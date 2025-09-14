import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-tajawal",
        "text-card-foreground placeholder:text-muted-foreground",
        "transition-all duration-200 ease-in-out resize-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "focus-visible:border-primary focus-visible:bg-background",
        "hover:border-primary/70 hover:bg-background/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "direction-rtl text-right",
        "shadow-sm hover:shadow-md focus-visible:shadow-md",
        className,
      )}
      ref={ref}
      style={{ direction: 'rtl', textAlign: 'right' }}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
