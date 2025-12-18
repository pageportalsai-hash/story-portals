import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { StoryMeta } from '@/types/story';

const BASE_PATH = import.meta.env.BASE_URL || '/';
const STORAGE_KEY_V1 = 'pageportals:progress:v1';

type ProgressEntryV1 = {
  percent?: number;
  scrollTop?: number;
  updatedAt?: number;
};

type ProgressMapV1 = Record<string, ProgressEntryV1>;

function readProgressMapV1FromStorage(): ProgressMapV1 {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY_V1);
    if (!stored) return {};
    return (JSON.parse(stored) ?? {}) as ProgressMapV1;
  } catch {
    return {};
  }
}

interface ContinueReadingRowProps {
  stories: StoryMeta[];
}

export function ContinueReadingRow({ stories }: ContinueReadingRowProps) {
  const [progressMap, setProgressMap] = useState<ProgressMapV1>({});

  useEffect(() => {
    const refresh = () => setProgressMap(readProgressMapV1FromStorage());
    refresh();

    // Refresh when user returns to the tab (covers back/forward + bfcache-like behavior)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    // Listen for custom event from StoryPage when progress updates
    const onProgressUpdate = () => refresh();

    // Listen for storage event (cross-tab updates)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_V1) refresh();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageportals:progress:updated', onProgressUpdate);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageportals:progress:updated', onProgressUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const storiesWithProgress = useMemo(() => {
    const entries = Object.entries(progressMap)
      .map(([slug, entry]) => {
        const story = stories.find((s) => s.slug === slug);
        if (!story) return null;

        const progress = Math.max(0, Math.min(100, Math.round(Number(entry?.percent ?? 0))));
        const lastRead = Number(entry?.updatedAt ?? 0);

        // Requirement: show if percent > 0 AND percent < 100 (not finished)
        if (progress <= 0 || progress >= 100) return null;

        return { story, progress, lastRead };
      })
      .filter(Boolean) as { story: StoryMeta; progress: number; lastRead: number }[];

    return entries.sort((a, b) => b.lastRead - a.lastRead);
  }, [progressMap, stories]);

  if (storiesWithProgress.length === 0) return null;

  return (
    <section className="px-4 md:px-8 lg:px-12 py-6">
      <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
        Continue Reading
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {storiesWithProgress.map(({ story, progress }) => {
          const imagePath = story.posterImage.startsWith('/')
            ? `${BASE_PATH}${story.posterImage.slice(1)}`
            : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

          return (
            <Link
              key={story.slug}
              to={`/story/${story.slug}`}
              state={{ resume: true }}
              className="flex-shrink-0 group snap-start"
            >
              <div className="relative w-40 md:w-48 aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                <img
                  src={imagePath}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-display text-sm text-white line-clamp-2 mb-2">
                    {story.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">{progress}% complete</span>
                    <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:text-primary-foreground group-hover:bg-primary px-2 py-1 rounded transition-colors">
                      <Play className="w-3 h-3" />
                      Resume
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

