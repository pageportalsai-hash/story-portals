import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Search, List, Focus, Volume2, Sparkles } from 'lucide-react';
import { StoryMeta } from '@/types/story';

interface LibraryToolsSectionProps {
  stories: StoryMeta[];
}

export function LibraryToolsSection({ stories }: LibraryToolsSectionProps) {
  // Collect all tags with their counts
  const topTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    stories.forEach((story) => {
      story.tags.forEach((tag) => {
        const normalized = tag.toLowerCase();
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [stories]);

  // Genre counts
  const genres = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    stories.forEach((story) => {
      const genre = story.genre;
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [stories]);

  // Quick filter links
  const shortReadsCount = stories.filter(s => s.readingTimeMins && s.readingTimeMins <= 25).length;
  const longReadsCount = stories.filter(s => s.readingTimeMins && s.readingTimeMins >= 45).length;

  return (
    <section className="border-t border-border/50 bg-gradient-to-b from-transparent to-card/20 py-8 md:py-10">
      <div className="px-4 md:px-12 max-w-7xl mx-auto">
        <h2 className="font-display text-lg md:text-xl font-semibold text-foreground mb-6">
          Explore the Library
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {/* Quick Filters */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Clock size={12} />
              Quick Filters
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <Link
                to="/#short-reads"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs transition-colors"
              >
                <span>Short Reads</span>
                <span className="text-muted-foreground">({shortReadsCount})</span>
              </Link>
              <Link
                to="/#long-reads"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs transition-colors"
              >
                <span>Long Reads</span>
                <span className="text-muted-foreground">({longReadsCount})</span>
              </Link>
              {genres.slice(0, 3).map(([genre, count]) => (
                <Link
                  key={genre}
                  to={`/#${genre.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs transition-colors"
                >
                  <span>{genre}</span>
                  <span className="text-muted-foreground">({count})</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Tags */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Sparkles size={12} />
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-1">
              {topTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-0.5 rounded bg-muted/30 text-muted-foreground text-xs hover:bg-muted hover:text-foreground transition-colors cursor-pointer capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Reader Tips */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
              <BookOpen size={12} />
              Reader Tips
            </h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Search size={12} className="flex-shrink-0 text-primary/70" />
                <span><strong className="text-foreground">Find</strong> to search within any story</span>
              </div>
              <div className="flex items-center gap-2">
                <List size={12} className="flex-shrink-0 text-primary/70" />
                <span><strong className="text-foreground">Chapters</strong> for long stories</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 size={12} className="flex-shrink-0 text-primary/70" />
                <span><strong className="text-foreground">Read to me</strong> for hands-free</span>
              </div>
              <div className="flex items-center gap-2">
                <Focus size={12} className="flex-shrink-0 text-primary/70" />
                <span><strong className="text-foreground">Focus mode</strong> to read distraction-free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
