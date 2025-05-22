import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-dex-secondary/20 bg-dex-dark/80 px-3 py-2 text-base text-white shadow-inner shadow-dex-secondary/5 backdrop-blur-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-dex-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dex-secondary/30 focus-visible:ring-offset-1 focus-visible:border-dex-secondary/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
