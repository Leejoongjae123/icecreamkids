import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const loaderVariants = cva(
  "inline-block animate-spin",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        default: "w-6 h-6", 
        lg: "w-8 h-8",
        xl: "w-48 h-48",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const textVariants = cva(
  "text-muted-foreground",
  {
    variants: {
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-xl", 
        xl: "text-4xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const gapVariants = cva(
  "flex flex-col items-center justify-center",
  {
    variants: {
      size: {
        sm: "gap-1",
        default: "gap-2",
        lg: "gap-3",
        xl: "gap-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  text?: string
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gapVariants({ size }), className)}
        {...props}
      >
        <img
          src="/report/loader.svg"
          alt="Loading..."
          className={cn(loaderVariants({ size }))}
        />
        {text && (
          <p className={cn(textVariants({ size }), "text-white")}>{text}</p>
        )}
      </div>
    )
  }
)
Loader.displayName = "Loader"

export { Loader, loaderVariants }
