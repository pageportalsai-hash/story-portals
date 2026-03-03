import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Volume2 } from 'lucide-react';
import { StoryMeta } from '@/types/story';

const BASE_PATH = import.meta.env.BASE_URL || '/';
const LAST_READ_KEY = 'pageportals:lastRead';
const PROGRESS_KEY_PREFIX = 'pageportals:progress:';

type ProgressV2 = {
  pct: number;
  scrollTop: number;
  updatedAt: number;
  ttsIndex?: number;
  ttsUpdatedAt?: number;
};

type ProgressMapV2 = Record<string, ProgressV2>;

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function readProgressMapV2FromStorage(): ProgressMapV2 {
  if (typeof window === 'undefined') return {};
  const map: ProgressMapV2 = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
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
        ttsIndex: typeof parsed.ttsIndex === 'number' ? parsed.ttsIndex : undefined,
        ttsUpdatedAt: typeof parsed.ttsUpdatedAt === 'number' ? parsed.ttsUpdatedAt : undefined,
      };
    }
  } catch { return {}; }
  return map;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

interface ContinueReadingRowProps {
  stories: StoryMeta[];
}

export function ContinueReadingRow({ stories }: ContinueReadingRowProps) {
  const [progressMap, setProgressMap] = useState<ProgressMapV2>({});

  useEffect(() => {
    const refresh = () => setProgressMap(readProgressMapV2FromStorage());
    refresh();
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
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
        const hasAudioSaved = typeof entry?.ttsIndex === 'number' && entry.ttsIndex > 0;
        if (pct < 0.01 || pct > 0.99) return null;
        return { story, progress, lastRead, hasAudioSaved };
      })
      .filter(Boolean) as { story: StoryMeta; progress: number; lastRead: number; hasAudioSaved: boolean }[];
    return entries.sort((a, b) => b.lastRead - a.lastRead);
  }, [progressMap, stories]);

  if (storiesWithProgress.length === 0) return null;

  return (
    <section className="px-4 md:px-8 lg:px-12 py-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-1 h-6 rounded-full bg-accent" />
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">Continue Reading</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {storiesWithProgress.map(({ story, progress, lastRead, hasAudioSaved }) => {
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
              <div className="relative w-40 md:w-48 aspect-[2/3] rounded-lg overflow-hidden bg-muted transition-all duration-300 group-hover:ring-2 group-hover:ring-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10">
                <img
                  src={imagePath}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Audio saved chip */}
                {hasAudioSaved && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-primary/90 text-primary-foreground text-xs rounded-full">
                    <Volume2 size={10} />
                    <span>Audio</span>
                  </div>
                )}

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                  <div
                    className="h-full bg-primary rounded-r-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-display text-sm text-white line-clamp-2 mb-1">{story.title}</h3>

                  {/* Time ago */}
                  <span className="text-[10px] text-white/40 mb-2 block">{timeAgo(lastRead)}</span>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">{progress}%</span>
                    <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:text-primary-foreground group-hover:bg-primary px-2 py-1 rounded-full transition-colors">
                      <Play className="w-3 h-3" fill="currentColor" />
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
