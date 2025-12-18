import { useEffect, useMemo, useRef, useState, RefObject, useCallback } from 'react';

export interface ProgressEntryV1 {
  percent: number;
  scrollTop: number;
  updatedAt: number;
}

export interface ReadingProgressData {
  slug: string;
  progress: number;
  scrollPosition: number;
  lastRead: number;
}

const STORAGE_KEY_V1 = 'pageportals:progress:v1';
const LEGACY_KEY = 'pageportals_reading_progress';

type ProgressMapV1 = Record<string, ProgressEntryV1>;

type LegacyReadingProgressData = Record<
  string,
  {
    slug: string;
    progress: number;
    scrollPosition: number;
    lastRead: number;
  }
>;

function clampPercent(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function readProgressMapV1(): ProgressMapV1 {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_V1);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }

  // One-time migration from legacy key if present
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return {};

    const parsed = JSON.parse(legacy) as LegacyReadingProgressData;
    const migrated: ProgressMapV1 = {};

    Object.values(parsed).forEach((p) => {
      migrated[p.slug] = {
        percent: clampPercent(p.progress ?? 0),
        scrollTop: Math.max(0, Math.round(p.scrollPosition ?? 0)),
        updatedAt: Number(p.lastRead ?? Date.now()),
      };
    });

    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
}

function writeProgressMapV1(map: ProgressMapV1) {
  try {
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function saveReadingProgress(slug: string, percent: number, scrollTop: number) {
  const all = readProgressMapV1();
  all[slug] = {
    percent: clampPercent(percent),
    scrollTop: Math.max(0, Math.round(scrollTop)),
    updatedAt: Date.now(),
  };
  writeProgressMapV1(all);
  
  // Dispatch custom event so ContinueReadingRow updates immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pageportals:progress:updated'));
  }
}

export function getStoryProgress(slug: string): number {
  const all = readProgressMapV1();
  return all[slug]?.percent ?? 0;
}

export function getStoryScrollPosition(slug: string): number {
  const all = readProgressMapV1();
  return all[slug]?.scrollTop ?? 0;
}

export function clearStoryProgress(slug: string) {
  const all = readProgressMapV1();
  delete all[slug];
  writeProgressMapV1(all);
}

export function useAllReadingProgress() {
  const [progressData, setProgressData] = useState<ReadingProgressData[]>([]);

  const refresh = useCallback(() => {
    const all = readProgressMapV1();
    const sorted = Object.entries(all)
      .map(([slug, entry]) => ({
        slug,
        progress: entry.percent,
        scrollPosition: entry.scrollTop,
        lastRead: entry.updatedAt,
      }))
      .filter((p) => p.progress > 0 && p.progress < 100)
      .sort((a, b) => b.lastRead - a.lastRead);

    setProgressData(sorted);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return progressData;
}

export function useReadingProgressTracker(
  slug: string | undefined,
  containerRef: RefObject<HTMLElement | null>
) {
  const [progress, setProgress] = useState(0);
  const lastWriteAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;
    let attachedEl: HTMLElement | null = null;

    // Initialize from storage immediately
    setProgress(getStoryProgress(slug));

    const compute = (el: HTMLElement) => {
      const scrollTop = el.scrollTop;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const percent = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
      return {
        scrollTop,
        percent: clampPercent(percent),
      };
    };

    const attachWhenReady = () => {
      if (!mounted) return;

      const el = containerRef.current;
      if (!el) {
        rafRef.current = requestAnimationFrame(attachWhenReady);
        return;
      }

      attachedEl = el;

      const onScroll = () => {
        const { scrollTop, percent } = compute(el);
        setProgress(percent);

        const now = Date.now();
        if (now - lastWriteAtRef.current >= 250) {
          lastWriteAtRef.current = now;
          saveReadingProgress(slug, percent, scrollTop);
        }
      };

      el.addEventListener('scroll', onScroll, { passive: true });
      // Prime
      onScroll();

      // Cleanup
      return () => {
        el.removeEventListener('scroll', onScroll);
      };
    };

    const detach = attachWhenReady();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      detach?.();

      // Final flush (best-effort)
      if (attachedEl) {
        const { scrollTop, percent } = compute(attachedEl);
        saveReadingProgress(slug, percent, scrollTop);
      }
    };
  }, [slug, containerRef]);

  return progress;
}
