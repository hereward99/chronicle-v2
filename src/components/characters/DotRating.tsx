import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface DotRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
}

export function DotRating({ value, max = 5, onChange, label, className }: DotRatingProps) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeMax = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : 5;
  const { isOnline, requireOnline } = useOnlineStatus();
  const interactive = Boolean(onChange);
  const canEdit = interactive && isOnline;


  const handleClick = (next: number) => {
    if (!onChange) return;
    if (!requireOnline("Changing this rating")) return;
    onChange(next);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && <span className="text-sm text-muted-foreground min-w-[80px]">{label}</span>}
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={!canEdit}
            onClick={() => handleClick(i + 1 === value ? 0 : i + 1)}
            title={interactive && !isOnline ? "You're offline — reconnect to make changes" : undefined}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-colors",
              i < value
                ? "bg-primary border-primary"
                : "bg-transparent border-muted-foreground/40",
              canEdit && "cursor-pointer hover:border-primary/70",
              !canEdit && "cursor-default",
              interactive && !isOnline && "opacity-60"
            )}
            aria-label={`${i + 1} of ${max}`}
          />
        ))}
      </div>
    </div>
  );
}
