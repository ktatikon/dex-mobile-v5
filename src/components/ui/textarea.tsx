import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-dex-secondary/30 bg-dex-dark px-4 py-3 text-base text-white ring-offset-background placeholder:text-dex-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dex-secondary/30 focus-visible:ring-offset-1 focus-visible:border-dex-secondary/40 disabled:cursor-not-allowed disabled:opacity-50 shadow-inner shadow-dex-secondary/5",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
