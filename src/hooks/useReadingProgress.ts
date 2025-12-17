import { useState, useEffect, useCallback } from 'react';

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

export function useReadingProgressTracker(slug: string | undefined) {
  useEffect(() => {
    if (!slug) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      const progress = Math.min(100, Math.max(0, scrollPercent));
      
      // Only save if user has scrolled past 5%
      if (progress > 5) {
        saveReadingProgress(slug, progress, scrollTop);
      }
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, [slug]);
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
