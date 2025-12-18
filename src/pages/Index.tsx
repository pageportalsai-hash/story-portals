import { useEffect, useMemo, useState } from 'react';
import { useLibrary } from '@/hooks/useStories';
import { Header } from '@/components/Header';
import { UnifiedHero } from '@/components/UnifiedHero';
import { ContinueReadingRow } from '@/components/ContinueReadingRow';
import { RowCarousel } from '@/components/RowCarousel';
import { Footer } from '@/components/Footer';
import { Loader2 } from 'lucide-react';

const LAST_READ_KEY = 'pageportals:lastRead';

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

const Index = () => {
  const { stories, loading, error } = useLibrary();
  const [lastRead, setLastRead] = useState<LastReadV2 | null>(null);

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

  // Organize stories into categories
  const categories = useMemo(() => {
    if (!stories.length) return null;

    // Featured story (first one or random)
    const featured = stories[0];

    // Filter by genre
    const sciFi = stories.filter(
      (s) =>
        s.genre.toLowerCase().includes('sci-fi') ||
        s.tags.some((t) => t.toLowerCase().includes('science fiction'))
    );

    const noir = stories.filter(
      (s) =>
        s.genre.toLowerCase().includes('noir') ||
        s.genre.toLowerCase().includes('mystery') ||
        s.tags.some((t) => t.toLowerCase().includes('noir'))
    );

    // Trending (for demo, just shuffle)
    const trending = [...stories].sort(() => Math.random() - 0.5).slice(0, 6);

    // New releases (sorted by year desc)
    const newReleases = [...stories]
      .filter((s) => s.year)
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .slice(0, 6);

    // All stories
    const all = stories;

    return { featured, sciFi, noir, trending, newReleases, all };
  }, [stories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading library...</p>
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
      {/* Header - includes spacer for fixed positioning */}
      <Header stories={stories} />

      {/* Unified Hero - Intro + Featured Story (negative margin to overlap header spacer for cinematic effect) */}
      <div className="-mt-[calc(env(safe-area-inset-top)+56px+48px)] md:-mt-[calc(env(safe-area-inset-top)+64px)]">
        <UnifiedHero story={categories.featured} />
      </div>

      {/* Continue Reading Row - only if lastRead exists (0.01..0.99) */}
      {showContinueReading && <ContinueReadingRow stories={stories} />}

      {/* Content Rows */}
      <main className="relative z-10 pb-8">
        <div id="trending-now">
          <RowCarousel title="Trending Now" stories={categories.trending} />
        </div>

        {categories.sciFi.length > 0 && <RowCarousel title="Science Fiction" stories={categories.sciFi} />}

        {categories.noir.length > 0 && <RowCarousel title="Noir & Mystery" stories={categories.noir} />}

        {categories.newReleases.length > 0 && <RowCarousel title="New Releases" stories={categories.newReleases} />}

        <RowCarousel title="All Stories" stories={categories.all} size="small" />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;

