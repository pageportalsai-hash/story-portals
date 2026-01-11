import { cn } from '@/lib/utils';

interface AdSlotProps {
  className?: string;
}

export function AdSlot({ className }: AdSlotProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center',
        'h-[var(--ad-slot-h)] bg-muted/90 backdrop-blur-sm border-t border-border',
        className
      )}
    >
      <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
        Ad space
      </span>
    </div>
  );
}
