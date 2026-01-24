import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const OnlineIndicator = ({
  isOnline,
  showLabel = false,
  size = "md",
  className,
}: OnlineIndicatorProps) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full",
          sizeClasses[size],
          isOnline
            ? "bg-success animate-pulse shadow-[0_0_8px_hsl(var(--success)/0.6)]"
            : "bg-muted-foreground/50"
        )}
      />
      {showLabel && (
        <span
          className={cn(
            "text-xs font-medium",
            isOnline ? "text-success" : "text-muted-foreground"
          )}
        >
          {isOnline ? "Online Now" : "Offline"}
        </span>
      )}
    </div>
  );
};

export default OnlineIndicator;
