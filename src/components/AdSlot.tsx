import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AdSlotProps {
  className?: string;
  'data-ad-client'?: string;
  'data-ad-slot'?: string;
}

export function AdSlot({ className, ...props }: AdSlotProps) {
  const adClient = props['data-ad-client'];
  const adSlot = props['data-ad-slot'];
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (adClient && adSlot && adRef.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // AdSense not loaded yet — silent fail
      }
    }
  }, [adClient, adSlot]);

  // Hide completely when no ad credentials provided
  if (!adClient || !adSlot) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center',
        'h-[var(--ad-slot-h)] bg-background/95 backdrop-blur-sm border-t border-border',
        className
      )}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
