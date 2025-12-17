import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useAllReadingProgress } from '@/hooks/useReadingProgress';
import { StoryMeta } from '@/types/story';

const BASE_PATH = import.meta.env.BASE_URL || '/';

interface ContinueReadingRowProps {
  stories: StoryMeta[];
}

export function ContinueReadingRow({ stories }: ContinueReadingRowProps) {
  const progressData = useAllReadingProgress();

  const storiesWithProgress = useMemo(() => {
    return progressData
      .map((p) => {
        const story = stories.find((s) => s.slug === p.slug);
        if (!story) return null;
        return { story, progress: p.progress };
      })
      .filter(Boolean) as { story: StoryMeta; progress: number }[];
  }, [progressData, stories]);

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
            : story.posterImage;

          return (
            <Link
              key={story.slug}
              to={`/story/${story.slug}`}
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
