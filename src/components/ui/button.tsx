import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-[44px] min-w-[44px] font-poppins",
  {
    variants: {
      variant: {
        // Primary 3D button with dark orange gradient and white ambient glow
        default: "bg-gradient-to-br from-dex-primary to-[#8B3508] text-white shadow-[0_4px_8px_rgba(255,255,255,0.05),0_1px_3px_rgba(177,66,10,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)] border border-dex-primary/20 hover:shadow-[0_4px_16px_rgba(255,255,255,0.1),0_1px_4px_rgba(177,66,10,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",

        // Positive actions with green gradient and green ambient glow
        positive: "bg-gradient-to-br from-dex-positive to-[#28A745] text-white shadow-[0_4px_8px_rgba(255,255,255,0.05),0_1px_3px_rgba(52,199,89,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)] border border-dex-positive/20 hover:shadow-[0_4px_16px_rgba(255,255,255,0.1),0_1px_4px_rgba(52,199,89,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",

        // Negative/destructive actions with red gradient and red ambient glow
        destructive: "bg-gradient-to-br from-dex-negative to-[#DC2626] text-white shadow-[0_4px_8px_rgba(255,255,255,0.05),0_1px_3px_rgba(255,59,48,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)] border border-dex-negative/20 hover:shadow-[0_4px_16px_rgba(255,255,255,0.1),0_1px_4px_rgba(255,59,48,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",

        // Neutral outline button with white ambient glow
        outline: "border border-dex-secondary/50 bg-dex-secondary/10 text-white shadow-[0_2px_4px_rgba(255,255,255,0.05),0_1px_2px_rgba(28,28,30,0.2)] hover:bg-dex-secondary/20 hover:shadow-[0_4px_8px_rgba(255,255,255,0.1),0_1px_3px_rgba(28,28,30,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200",

        // Secondary button with accent color
        secondary: "bg-gradient-to-br from-dex-accent to-[#CD853F] text-white shadow-[0_4px_8px_rgba(255,255,255,0.05),0_1px_3px_rgba(210,105,30,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)] border border-dex-accent/20 hover:shadow-[0_4px_16px_rgba(255,255,255,0.1),0_1px_4px_rgba(210,105,30,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",

        // Ghost button with subtle effects
        ghost: "hover:bg-dex-secondary/10 hover:text-dex-text-primary hover:shadow-[0_2px_8px_rgba(255,255,255,0.1)] active:shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-all duration-200",

        // Link style
        link: "text-dex-primary underline-offset-4 hover:underline hover:text-dex-accent transition-colors duration-200",

        // Premium glossy button with enhanced effects
        glossy: "bg-gradient-to-br from-dex-primary via-[#B1420A] to-[#8B3508] text-white shadow-[0_6px_12px_rgba(255,255,255,0.08),0_2px_4px_rgba(177,66,10,0.4),inset_0_2px_4px_rgba(255,255,255,0.15)] border border-white/10 hover:shadow-[0_8px_20px_rgba(255,255,255,0.12),0_3px_6px_rgba(177,66,10,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-70",

        // Legacy primary for compatibility
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
