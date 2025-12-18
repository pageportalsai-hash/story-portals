import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { StoryMeta } from '@/types/story';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePreviewDrawer } from './MobilePreviewDrawer';

interface PosterCardProps {
  story: StoryMeta;
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
}

const BASE_PATH = import.meta.env.BASE_URL || '/';

export function PosterCard({ story, size = 'medium', priority = false }: PosterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const sizeClasses = {
    small: 'w-36 h-52 md:w-40 md:h-56',
    medium: 'w-44 h-64 md:w-52 md:h-72',
    large: 'w-56 h-80 md:w-64 md:h-96',
  };

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle video play/pause on hover (desktop only)
  useEffect(() => {
    if (!videoRef.current || !story.posterVideo || isMobile) return;

    if (isHovered && isVisible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered, isVisible, story.posterVideo, isMobile]);

  const imagePath = story.posterImage.startsWith('/')
    ? `${BASE_PATH}${story.posterImage.slice(1)}`
    : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

  const videoPath = story.posterVideo
    ? story.posterVideo.startsWith('/')
      ? `${BASE_PATH}${story.posterVideo.slice(1)}`
      : `${BASE_PATH}stories/${story.slug}/${story.posterVideo}`
    : null;

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setPreviewOpen(true);
    }
    // On desktop, let Link handle navigation normally
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isMobile) {
        e.preventDefault();
        setPreviewOpen(true);
      } else {
        navigate(`/story/${story.slug}`);
      }
    }
  };

  return (
    <>
      <Link
        to={`/story/${story.slug}`}
        className="block outline-none group"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label={`Read ${story.title}`}
      >
        <div
          ref={cardRef}
          className={`poster-card ${sizeClasses[size]} relative cursor-pointer`}
        >
          {/* Background Image */}
          {isVisible && (
            <img
              src={imagePath}
              alt={story.title}
              loading={priority ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Video Preview (desktop only) */}
          {videoPath && isVisible && !isMobile && (
            <video
              ref={videoRef}
              src={videoPath}
              muted
              loop
              playsInline
              preload="none"
              onLoadedData={() => setVideoLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isHovered && videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Gradient Overlay - enhanced bottom gradient for title readability */}
          <div className="absolute inset-0 card-overlay" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />

          {/* Content Overlay */}
          <div
            className={`absolute inset-0 flex flex-col justify-end p-3 transition-all duration-300 ${
              isHovered ? 'bg-background/60' : ''
            }`}
          >
            {/* Genre Chip */}
            <span className="genre-chip self-start mb-auto mt-2">{story.genre}</span>

            {/* Title */}
            <h3 className="font-display text-sm md:text-base font-semibold text-foreground line-clamp-2 mb-1">
              {story.title}
            </h3>

            {/* Synopsis (on hover - desktop only) */}
            <p
              className={`text-xs text-muted-foreground line-clamp-3 transition-all duration-300 hidden md:block ${
                isHovered ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
              }`}
            >
              {story.synopsis}
            </p>

            {/* CTA Button (on hover - desktop only) */}
            <div
              className={`items-center gap-2 mt-2 transition-all duration-300 hidden md:flex ${
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                <Play size={12} fill="currentColor" />
                Read
              </span>
              {story.readingTimeMins && (
                <span className="text-xs text-muted-foreground">
                  {story.readingTimeMins} min
                </span>
              )}
            </div>

            {/* Mobile: show reading time always */}
            {story.readingTimeMins && (
              <span className="text-xs text-muted-foreground md:hidden">
                {story.readingTimeMins} min
              </span>
            )}
          </div>

          {/* Video indicator */}
          {story.posterVideo && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
              <Play size={12} className="text-primary" fill="currentColor" />
            </div>
          )}
        </div>
      </Link>

      {/* Mobile Preview Drawer */}
      {isMobile && (
        <MobilePreviewDrawer
          story={story}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </>
  );
}
