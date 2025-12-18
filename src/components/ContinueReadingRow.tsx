import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { StoryMeta } from '@/types/story';

const BASE_PATH = import.meta.env.BASE_URL || '/';
const LAST_READ_KEY = 'pageportals:lastRead';
const PROGRESS_KEY_PREFIX = 'pageportals:progress:';

type ProgressV2 = {
  pct: number;
  scrollTop: number;
  updatedAt: number;
};

type ProgressMapV2 = Record<string, ProgressV2>;

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readProgressMapV2FromStorage(): ProgressMapV2 {
  if (typeof window === 'undefined') return {};

  const map: ProgressMapV2 = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Ignore older map key
      if (key === 'pageportals:progress:v1') continue;

      if (!key.startsWith(PROGRESS_KEY_PREFIX)) continue;
      const slug = key.slice(PROGRESS_KEY_PREFIX.length);
      if (!slug) continue;

      const parsed = safeParseJSON<ProgressV2>(localStorage.getItem(key));
      if (!parsed || typeof parsed.pct !== 'number' || typeof parsed.scrollTop !== 'number') continue;

      map[slug] = {
        pct: Math.min(1, Math.max(0, parsed.pct)),
        scrollTop: Math.max(0, parsed.scrollTop),
        updatedAt: Number(parsed.updatedAt ?? 0),
      };
    }
  } catch {
    return {};
  }

  return map;
}

interface ContinueReadingRowProps {
  stories: StoryMeta[];
}

export function ContinueReadingRow({ stories }: ContinueReadingRowProps) {
  const [progressMap, setProgressMap] = useState<ProgressMapV2>({});

  useEffect(() => {
    const refresh = () => setProgressMap(readProgressMapV2FromStorage());
    refresh();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    const onProgressUpdate = () => refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(PROGRESS_KEY_PREFIX) || e.key === LAST_READ_KEY) refresh();
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

        const pct = Math.min(1, Math.max(0, Number(entry?.pct ?? 0)));
        const progress = Math.max(0, Math.min(100, Math.round(pct * 100)));
        const lastRead = Number(entry?.updatedAt ?? 0);

        // Requirement: show if pct > 0.01 AND pct < 0.99 (not finished)
        if (pct < 0.01 || pct > 0.99) return null;

        return { story, progress, lastRead };
      })
      .filter(Boolean) as { story: StoryMeta; progress: number; lastRead: number }[];

    return entries.sort((a, b) => b.lastRead - a.lastRead);
  }, [progressMap, stories]);

  if (storiesWithProgress.length === 0) return null;

  return (
    <section className="px-4 md:px-8 lg:px-12 py-6">
      <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Continue Reading</h2>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {storiesWithProgress.map(({ story, progress }) => {
          const imagePath = story.posterImage.startsWith('/')
            ? `${BASE_PATH}${story.posterImage.slice(1)}`
            : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

          return (
            <Link
              key={story.slug}
              to={`/story/${story.slug}`}
              state={{ autoResume: true }}
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
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-display text-sm text-white line-clamp-2 mb-2">{story.title}</h3>

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


