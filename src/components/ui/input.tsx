import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm",
          "font-tajawal text-right text-foreground placeholder:text-muted-foreground",
          "transition-all duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
          "focus-visible:border-primary focus-visible:bg-white",
          "hover:border-primary/50 hover:shadow-sm",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "shadow-sm border-2",
          "[direction:rtl]",
          className,
        )}
        ref={ref}
        dir="rtl"
        style={{ 
          direction: 'rtl', 
          textAlign: 'right',
          backgroundColor: '#ffffff',
          fontFamily: 'Tajawal, system-ui, sans-serif'
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
