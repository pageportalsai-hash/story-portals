import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLibrary } from '@/hooks/useStories';
import { Header } from '@/components/Header';
import { UnifiedHero } from '@/components/UnifiedHero';
import { ContinueReadingRow } from '@/components/ContinueReadingRow';
import { RowCarousel } from '@/components/RowCarousel';
import { Footer } from '@/components/Footer';
import { LibraryToolsSection } from '@/components/LibraryToolsSection';
import { BookOpen } from 'lucide-react';
import { StoryMeta } from '@/types/story';

const LAST_READ_KEY = 'pageportals:lastRead';
const STORY_OPENS_KEY = 'pageportals:storyOpens';

type LastReadV2 = {
  slug: string;
  pct: number;
  updatedAt: number;
  title?: string;
  posterImage?: string;
};

function readLastRead(): LastReadV2 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastReadV2;
    if (!parsed?.slug || typeof parsed.pct !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

// Get story opens count for "Most Read" feature
function getStoryOpens(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORY_OPENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Get stable random seed per session for trending shuffle
function getSessionSeed(): number {
  if (typeof window === 'undefined') return 0;
  const key = 'pageportals:sessionSeed';
  let seed = sessionStorage.getItem(key);
  if (!seed) {
    seed = String(Math.random());
    sessionStorage.setItem(key, seed);
  }
  return parseFloat(seed);
}

// Seeded shuffle for stable randomization
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;
  
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

// Dev-only performance logging
const IS_DEV = import.meta.env.DEV;
const perfMark = (name: string) => {
  if (IS_DEV && typeof performance !== 'undefined') {
    performance.mark(name);
    console.log(`[Perf] ${name}:`, performance.now().toFixed(1) + 'ms');
  }
};

const SCROLL_POSITION_KEY = 'pageportals:homeScrollY';

const Index = () => {
  perfMark('Index:render-start');
  
  const { stories, loading, error } = useLibrary();
  const [lastRead, setLastRead] = useState<LastReadV2 | null>(null);
  const [showDeferredRows, setShowDeferredRows] = useState(false);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScrollY = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (savedScrollY) {
      const scrollY = parseInt(savedScrollY, 10);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
    
    // Save scroll position when leaving
    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
    };
    
    window.addEventListener('beforeunload', saveScroll);
    
    // Also save on route change (hashchange for HashRouter)
    window.addEventListener('hashchange', saveScroll);
    
    return () => {
      saveScroll();
      window.removeEventListener('beforeunload', saveScroll);
      window.removeEventListener('hashchange', saveScroll);
    };
  }, []);

  useEffect(() => {
    const refresh = () => setLastRead(readLastRead());
    refresh();

    const onFocus = () => refresh();
    const onProgressUpdated = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_READ_KEY) refresh();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageportals:progress:updated', onProgressUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageportals:progress:updated', onProgressUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Progressive render: defer lower-priority rows until after first paint
  useEffect(() => {
    if (!stories.length) return;
    
    perfMark('Index:above-fold-painted');
    
    // Use requestIdleCallback if available, else setTimeout
    const defer = typeof requestIdleCallback !== 'undefined' 
      ? requestIdleCallback 
      : (cb: () => void) => setTimeout(cb, 150);
    
    defer(() => {
      setShowDeferredRows(true);
      perfMark('Index:deferred-rows-rendered');
    });
  }, [stories.length]);

  // Log when library loads
  useEffect(() => {
    if (!loading && stories.length > 0) {
      perfMark('Index:library-loaded');
    }
  }, [loading, stories.length]);

  // Organize stories into categories - memoized for performance
  const categories = useMemo(() => {
    if (!stories.length) return null;

    const sessionSeed = getSessionSeed();
    const storyOpens = getStoryOpens();

    // Featured story - use most opened locally, or first story
    let featured = stories[0];
    const openCounts = stories.map(s => ({ story: s, opens: storyOpens[s.slug] || 0 }));
    const mostOpened = openCounts.sort((a, b) => b.opens - a.opens)[0];
    if (mostOpened && mostOpened.opens > 0) {
      featured = mostOpened.story;
    }

    // Filter by genre
    const sciFi = stories.filter(
      (s) =>
        s.genre.toLowerCase().includes('sci-fi') ||
        s.genre.toLowerCase().includes('science fiction') ||
        s.tags.some((t) => t.toLowerCase().includes('science fiction'))
    );

    const noir = stories.filter(
      (s) =>
        s.genre.toLowerCase().includes('noir') ||
        s.genre.toLowerCase().includes('mystery') ||
        s.tags.some((t) => t.toLowerCase().includes('noir'))
    );

    const literary = stories.filter(
      (s) =>
        s.genre.toLowerCase().includes('literary') ||
        s.genre.toLowerCase().includes('fiction')
    );

    // New releases (sorted by year desc) — compute first for de-dup
    const newReleases = [...stories]
      .filter((s) => s.year)
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .slice(0, 12);

    const newReleaseSlugs = new Set(newReleases.map(s => s.slug));

    // Trending - stable shuffle, excluding new releases
    const trending = seededShuffle(stories, sessionSeed)
      .filter(s => !newReleaseSlugs.has(s.slug))
      .slice(0, 12);

    // Short reads (<= 25 mins)
    const shortReads = stories
      .filter((s) => s.readingTimeMins && s.readingTimeMins <= 25)
      .sort((a, b) => (a.readingTimeMins || 0) - (b.readingTimeMins || 0));

    // Long reads (>= 45 mins)
    const longReads = stories
      .filter((s) => s.readingTimeMins && s.readingTimeMins >= 45)
      .sort((a, b) => (b.readingTimeMins || 0) - (a.readingTimeMins || 0));

    // Most Read (device-local)
    const mostRead = openCounts
      .filter(o => o.opens > 0)
      .sort((a, b) => b.opens - a.opens)
      .map(o => o.story)
      .slice(0, 12);

    // All stories
    const all = stories;

    return { featured, sciFi, noir, literary, trending, newReleases, shortReads, longReads, mostRead, all };
  }, [stories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="relative">
            <BookOpen className="w-10 h-10 text-primary animate-pulse" />
            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-display text-lg text-foreground">PagePortals</h2>
            <p className="text-sm text-muted-foreground">Loading your library...</p>
          </div>
          <div className="w-32 h-0.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-display text-2xl text-foreground mb-2">Unable to load library</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!categories || !stories.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-display text-2xl text-foreground mb-2">No stories yet</h1>
          <p className="text-muted-foreground">Add your first story to get started!</p>
        </div>
      </div>
    );
  }

  const showContinueReading =
    Boolean(lastRead) && lastRead!.pct >= 0.01 && lastRead!.pct <= 0.99;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header stories={stories} />

      {/* Unified Hero */}
      <div className="-mt-[calc(env(safe-area-inset-top)+56px+48px)] md:-mt-[calc(env(safe-area-inset-top)+64px)]">
        <UnifiedHero story={categories.featured} />
      </div>

      {/* Continue Reading Row */}
      {showContinueReading && <ContinueReadingRow stories={stories} />}

      {/* Content Rows - Above the fold (always render) */}
      <main className="relative z-10 pb-8">
        {/* Most Read - only show if user has history */}
        {categories.mostRead.length > 0 && (
          <RowCarousel title="Most Read" stories={categories.mostRead} />
        )}

        <div id="trending-now">
          <RowCarousel title="Trending Now" stories={categories.trending} />
        </div>

        {/* Deferred rows - render after first paint for performance */}
        {showDeferredRows && (
          <>
            {categories.newReleases.length > 0 && (
              <RowCarousel title="New Releases" stories={categories.newReleases} />
            )}

            {categories.shortReads.length > 0 && (
              <RowCarousel title="Short Reads" stories={categories.shortReads} subtitle="Under 25 min" />
            )}

            {categories.longReads.length > 0 && (
              <RowCarousel title="Long Reads" stories={categories.longReads} subtitle="45+ min" />
            )}

            {categories.sciFi.length > 0 && (
              <RowCarousel title="Science Fiction" stories={categories.sciFi} />
            )}

            {categories.noir.length > 0 && (
              <RowCarousel title="Noir & Mystery" stories={categories.noir} />
            )}

            {categories.literary.length > 0 && (
              <RowCarousel title="Literary Fiction" stories={categories.literary} />
            )}

            <RowCarousel title="All Stories" stories={categories.all} size="small" />
          </>
        )}
      </main>

      {/* Library Tools Section */}
      <LibraryToolsSection stories={stories} />

      {/* Footer - integrated with ad slot area */}
      <Footer storyCount={stories.length} />
    </div>
  );
};

export default Index;
