import { useState, useEffect, useCallback, RefObject } from 'react';

export interface ReadingProgressData {
  slug: string;
  progress: number;
  scrollPosition: number;
  lastRead: number;
}

const STORAGE_KEY = 'pageportals_reading_progress';

export function getReadingProgress(): Record<string, ReadingProgressData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveReadingProgress(slug: string, progress: number, scrollPosition: number) {
  try {
    const all = getReadingProgress();
    all[slug] = {
      slug,
      progress: Math.round(progress),
      scrollPosition: Math.round(scrollPosition),
      lastRead: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable
  }
}

// Updated to track scroll inside a container element (reader pane)
export function useReadingProgressTracker(
  slug: string | undefined,
  containerRef: RefObject<HTMLElement | null>
) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!slug) return;

    const container = containerRef.current;
    if (!container) return;

    const updateProgress = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      const currentProgress = Math.min(100, Math.max(0, scrollPercent));
      
      setProgress(currentProgress);
      
      // Only save if user has scrolled past 5%
      if (currentProgress > 5) {
        saveReadingProgress(slug, currentProgress, scrollTop);
      }
    };

    container.addEventListener('scroll', updateProgress);
    updateProgress();
    
    return () => container.removeEventListener('scroll', updateProgress);
  }, [slug, containerRef]);

  return progress;
}

export function getStoryScrollPosition(slug: string): number {
  const all = getReadingProgress();
  return all[slug]?.scrollPosition || 0;
}

export function useAllReadingProgress() {
  const [progressData, setProgressData] = useState<ReadingProgressData[]>([]);

  useEffect(() => {
    const all = getReadingProgress();
    const sorted = Object.values(all)
      .filter((p) => p.progress > 5 && p.progress < 100)
      .sort((a, b) => b.lastRead - a.lastRead);
    setProgressData(sorted);
  }, []);

  return progressData;
}

export function getStoryProgress(slug: string): number {
  const all = getReadingProgress();
  return all[slug]?.progress || 0;
}

export function clearStoryProgress(slug: string) {
  try {
    const all = getReadingProgress();
    delete all[slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable
  }
}
