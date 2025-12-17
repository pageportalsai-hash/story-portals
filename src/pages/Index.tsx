import { useMemo } from 'react';
import { useLibrary } from '@/hooks/useStories';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { IntroSection } from '@/components/IntroSection';
import { RowCarousel } from '@/components/RowCarousel';
import { Footer } from '@/components/Footer';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { stories, loading, error } = useLibrary();

  // Organize stories into categories
  const categories = useMemo(() => {
    if (!stories.length) return null;

    // Featured story (first one or random)
    const featured = stories[0];

    // Filter by genre
    const sciFi = stories.filter((s) =>
      s.genre.toLowerCase().includes('sci-fi') ||
      s.tags.some((t) => t.toLowerCase().includes('science fiction'))
    );

    const noir = stories.filter((s) =>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header stories={stories} />

      {/* Hero Section */}
      <HeroSection story={categories.featured} />

      {/* Intro Section */}
      <IntroSection />

      {/* Content Rows */}
      <main className="relative z-10 pb-8">
        <div id="trending-now">
          <RowCarousel title="Trending Now" stories={categories.trending} />
        </div>

        {categories.sciFi.length > 0 && (
          <RowCarousel title="Science Fiction" stories={categories.sciFi} />
        )}

        {categories.noir.length > 0 && (
          <RowCarousel title="Noir & Mystery" stories={categories.noir} />
        )}

        {categories.newReleases.length > 0 && (
          <RowCarousel title="New Releases" stories={categories.newReleases} />
        )}

        <RowCarousel title="All Stories" stories={categories.all} size="small" />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
