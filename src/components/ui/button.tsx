import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-[44px] min-w-[44px]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-dex-secondary to-dex-secondary/80 text-black shadow-md shadow-dex-secondary/30 backdrop-blur-sm border border-dex-secondary/30 hover:shadow-lg hover:shadow-dex-secondary/50 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] active:scale-[0.98] active:shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-200",
        destructive:
          "bg-gradient-to-r from-dex-primary to-dex-primary/80 text-white shadow-md shadow-dex-primary/30 backdrop-blur-sm border border-dex-primary/30 hover:shadow-lg hover:shadow-dex-primary/50 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] active:scale-[0.98] active:shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-200",
        outline:
          "border border-dex-secondary/50 bg-dex-secondary/10 text-white hover:bg-dex-secondary/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:shadow-dex-secondary/30 hover:shadow-[0_0_8px_rgba(255,255,255,0.2)] active:shadow-[0_0_5px_rgba(0,0,0,0.3)] transition-all duration-200",
        secondary:
          "bg-gradient-to-r from-dex-accent/90 to-dex-accent/70 text-white shadow-md shadow-dex-accent/30 backdrop-blur-sm border border-dex-accent/30 hover:shadow-lg hover:shadow-dex-accent/50 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] active:scale-[0.98] active:shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-200",
        ghost: "hover:bg-dex-secondary/10 hover:text-dex-secondary hover:shadow-[0_0_8px_rgba(255,255,255,0.15)] active:shadow-[0_0_5px_rgba(0,0,0,0.2)] transition-all duration-200",
        link: "text-dex-secondary underline-offset-4 hover:underline",
        glossy: "bg-gradient-to-r from-dex-secondary via-dex-secondary/90 to-dex-secondary/80 text-black shadow-md shadow-dex-secondary/40 backdrop-blur-sm border border-white/10 hover:shadow-lg hover:shadow-dex-secondary/60 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] active:scale-[0.98] active:shadow-[0_0_10px_rgba(0,0,0,0.6)] transition-all duration-200 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/30 before:opacity-70",
        primary: "bg-dex-primary text-white shadow-md shadow-dex-primary/30 backdrop-blur-sm border border-dex-primary/30 hover:shadow-lg hover:shadow-dex-primary/50 hover:bg-dex-primary/90 active:scale-[0.98] transition-all duration-200",
      },
      size: {
        default: "h-11 px-4 py-3",
        sm: "h-11 rounded-lg px-4 py-3",
        lg: "h-12 rounded-lg px-4 py-3",
        icon: "h-11 w-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
