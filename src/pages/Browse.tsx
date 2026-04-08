import { useMemo, useState } from 'react';
import { useLibrary } from '@/hooks/useStories';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PosterCard } from '@/components/PosterCard';
import { BookOpen } from 'lucide-react';

type SortOption = 'newest' | 'shortest' | 'longest' | 'az';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'shortest', label: 'Shortest' },
  { value: 'longest', label: 'Longest' },
  { value: 'az', label: 'A–Z' },
];

const Browse = () => {
  const { stories, loading } = useLibrary();
  const [activeGenre, setActiveGenre] = useState('All');
  const [sort, setSort] = useState<SortOption>('newest');

  // Derive unique genres from stories
  const genres = useMemo(() => {
    if (!stories.length) return ['All'];
    const genreSet = new Set<string>();
    stories.forEach((s) => {
      const g = s.genre.trim();
      if (g) genreSet.add(g);
    });
    return ['All', ...Array.from(genreSet).sort()];
  }, [stories]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = activeGenre === 'All'
      ? [...stories]
      : stories.filter((s) => s.genre === activeGenre);

    switch (sort) {
      case 'newest':
        list.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'shortest':
        list.sort((a, b) => (a.readingTimeMins || 999) - (b.readingTimeMins || 999));
        break;
      case 'longest':
        list.sort((a, b) => (b.readingTimeMins || 0) - (a.readingTimeMins || 0));
        break;
      case 'az':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return list;
  }, [stories, activeGenre, sort]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <BookOpen className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header stories={stories} />

      <main className="px-4 md:px-12 py-8 max-w-7xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
          Browse Library
        </h1>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2 flex-1">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeGenre === genre
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-fit"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? 'story' : 'stories'}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {filtered.map((story) => (
            <PosterCard key={story.slug} story={story} size="medium" />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No stories match this filter.</p>
          </div>
        )}
      </main>

      <Footer storyCount={stories.length} />
    </div>
  );
};

export default Browse;
