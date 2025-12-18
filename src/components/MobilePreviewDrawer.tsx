import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { StoryMeta } from '@/types/story';
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer';

interface MobilePreviewDrawerProps {
  story: StoryMeta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BASE_PATH = import.meta.env.BASE_URL || '/';

export function MobilePreviewDrawer({ story, open, onOpenChange }: MobilePreviewDrawerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (open && story?.posterVideo && !prefersReducedMotion) {
      videoRef.current.play().catch(() => {});
    }
    if (!open) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open, story?.posterVideo, prefersReducedMotion]);

  if (!story) return null;

  const imagePath = story.posterImage.startsWith('/')
    ? `${BASE_PATH}${story.posterImage.slice(1)}`
    : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

  const videoPath = story.posterVideo
    ? story.posterVideo.startsWith('/')
      ? `${BASE_PATH}${story.posterVideo.slice(1)}`
      : `${BASE_PATH}stories/${story.slug}/${story.posterVideo}`
    : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[85vh]">
        <div className="relative w-full">
          {/* Close button */}
          <DrawerClose className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background transition-colors">
            <X size={18} />
          </DrawerClose>

          {/* Media Container */}
          <div className="relative w-full aspect-[3/4] max-h-[50vh] overflow-hidden rounded-t-lg">
            <img
              src={imagePath}
              alt={story.title}
              className="w-full h-full object-cover"
            />
            
            {/* Video overlay */}
            {videoPath && (
              <video
                ref={videoRef}
                src={videoPath}
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
          </div>

          {/* Content */}
          <div className="px-5 pb-6 -mt-12 relative z-10">
            {/* Genre chip */}
            <span className="genre-chip mb-2">{story.genre}</span>

            {/* Title */}
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              {story.title}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              {story.year && <span>{story.year}</span>}
              {story.readingTimeMins && <span>{story.readingTimeMins} min read</span>}
              {story.author && <span>by {story.author}</span>}
            </div>

            {/* Synopsis */}
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-3">
              {story.synopsis}
            </p>

            {/* Read button */}
            <Link
              to={`/story/${story.slug}`}
              onClick={() => onOpenChange(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Play size={18} fill="currentColor" />
              Read Now
            </Link>

            {/* Tags */}
            {story.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {story.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}