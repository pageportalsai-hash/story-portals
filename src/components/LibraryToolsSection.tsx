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
    <section className="border-t border-border bg-card/30 py-10 md:py-14">
      <div className="px-4 md:px-12 max-w-7xl mx-auto">
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-8">
          Explore the Library
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Quick Filters */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Clock size={14} />
              Quick Filters
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/#short-reads"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-secondary-foreground text-sm transition-colors"
              >
                <span>Short Reads</span>
                <span className="text-xs text-muted-foreground">({shortReadsCount})</span>
              </Link>
              <Link
                to="/#long-reads"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-secondary-foreground text-sm transition-colors"
              >
                <span>Long Reads</span>
                <span className="text-xs text-muted-foreground">({longReadsCount})</span>
              </Link>
              {genres.slice(0, 4).map(([genre, count]) => (
                <Link
                  key={genre}
                  to={`/#${genre.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-secondary-foreground text-sm transition-colors"
                >
                  <span>{genre}</span>
                  <span className="text-xs text-muted-foreground">({count})</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Tags */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Sparkles size={14} />
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-1 rounded-md bg-muted/40 text-muted-foreground text-xs hover:bg-muted hover:text-foreground transition-colors cursor-pointer capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Reader Tips */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <BookOpen size={14} />
              Reader Tips
            </h3>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Search size={14} className="mt-0.5 flex-shrink-0" />
                <span>Use <strong className="text-foreground">Find</strong> to search within any story</span>
              </div>
              <div className="flex items-start gap-2">
                <List size={14} className="mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Chapters</strong> navigation for long stories</span>
              </div>
              <div className="flex items-start gap-2">
                <Volume2 size={14} className="mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Read to me</strong> for hands-free listening</span>
              </div>
              <div className="flex items-start gap-2">
                <Focus size={14} className="mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Focus mode</strong> for distraction-free reading</span>
              </div>
            </div>
          </div>
        </div>

        {/* Story count footer */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{stories.length}</span> stories in the library
          </p>
        </div>
      </div>
    </section>
  );
}
