import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { StoryMeta } from '@/types/story';

interface PosterCardProps {
  story: StoryMeta;
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
}

const BASE_PATH = import.meta.env.BASE_URL || '/';

// Detect touch device
const getIsTouch = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export function PosterCard({ story, size = 'medium', priority = false }: PosterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const previewTimeoutRef = useRef<number | null>(null);
  const slugRef = useRef(story.slug);

  const sizeClasses = {
    small: 'w-36 h-52 md:w-40 md:h-56',
    medium: 'w-44 h-64 md:w-52 md:h-72',
    large: 'w-56 h-80 md:w-64 md:h-96',
  };

  const imagePath = story.posterImage.startsWith('/')
    ? `${BASE_PATH}${story.posterImage.slice(1)}`
    : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

  const videoPath = story.posterVideo
    ? story.posterVideo.startsWith('/')
      ? `${BASE_PATH}${story.posterVideo.slice(1)}`
      : `${BASE_PATH}stories/${story.slug}/${story.posterVideo}`
    : null;

  // Intersection observer for visibility (lazy loading)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Stop preview function
  const stopPreview = useCallback(() => {
    setIsPreviewing(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  }, []);

  // Listen for other cards opening preview (only one at a time)
  useEffect(() => {
    const handleOtherPreview = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug: string }>;
      if (customEvent.detail.slug !== slugRef.current && isPreviewing) {
        stopPreview();
      }
    };

    window.addEventListener('pageportals:preview:open', handleOtherPreview);
    return () => window.removeEventListener('pageportals:preview:open', handleOtherPreview);
  }, [isPreviewing, stopPreview]);

  // Cancel preview on scroll
  useEffect(() => {
    if (!isPreviewing) return;

    const handleScroll = () => stopPreview();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPreviewing, stopPreview]);

  // Cancel preview on outside click
  useEffect(() => {
    if (!isPreviewing) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (document.querySelector('[role="dialog"][data-state="open"], [data-radix-dialog-content], [data-radix-alert-dialog-content]')) {
        return;
      }
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        stopPreview();
      }
    };

    document.addEventListener('click', handleOutsideClick, { capture: true });
    document.addEventListener('touchstart', handleOutsideClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleOutsideClick, { capture: true });
      document.removeEventListener('touchstart', handleOutsideClick, { capture: true });
    };
  }, [isPreviewing, stopPreview]);

  // Load video src ONLY when hovered/previewing AND visible - performance optimization
  useEffect(() => {
    if (!videoPath || !isVisible) return;
    
    const shouldLoadVideo = isHovered || isPreviewing;
    
    if (shouldLoadVideo && !videoReady) {
      setVideoReady(true);
    }
  }, [isHovered, isPreviewing, isVisible, videoPath, videoReady]);

  // Handle video play/pause on hover (desktop only)
  useEffect(() => {
    if (!videoRef.current || !story.posterVideo || !videoReady) return;
    const isTouch = getIsTouch();
    if (isTouch) return;

    if (isHovered && isVisible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered, isVisible, story.posterVideo, videoReady]);

  const handleClick = (e: React.MouseEvent) => {
    const isTouch = getIsTouch();

    if (isTouch && videoPath) {
      if (!isPreviewing) {
        e.preventDefault();
        e.stopPropagation();
        setIsPreviewing(true);
        setVideoReady(true);

        window.dispatchEvent(
          new CustomEvent('pageportals:preview:open', { detail: { slug: story.slug } })
        );

        requestAnimationFrame(() => {
          const v = videoRef.current;
          if (!v) return;
          v.muted = true;
          (v as any).playsInline = true;
          v.play().catch(() => {});
        });

        previewTimeoutRef.current = window.setTimeout(() => {
          stopPreview();
        }, 4000);

        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate(`/story/${story.slug}`);
    }
  };

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const showOverlay = isHovered || isPreviewing;

  return (
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
        className={`poster-card ${sizeClasses[size]} relative cursor-pointer group/card`}
      >
        {/* Background Image - lazy loaded with decoding async */}
        {isVisible && (
          <img
            src={imagePath}
            alt={story.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover/card:scale-105 group-hover/card:saturate-110"
          />
        )}

        {/* Video Preview - ONLY mount when needed for performance */}
        {videoPath && videoReady && (
          <video
            ref={videoRef}
            src={videoPath}
            muted
            loop
            playsInline
            preload="none"
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              (isHovered && videoLoaded) || isPreviewing ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Reduced Gradient Overlay - less blocking, more art visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent opacity-80 group-hover/card:opacity-60 transition-opacity duration-300" />

        {/* Content Overlay */}
        <div
          className={`absolute inset-0 flex flex-col justify-end p-3 transition-all duration-300 ${
            showOverlay ? 'bg-background/40' : ''
          }`}
        >
          {/* Genre Chip */}
          <span className="genre-chip self-start mb-auto mt-2 opacity-90">{story.genre}</span>

          {/* Title - with subtle text shadow for readability */}
          <h3 className="font-display text-sm md:text-base font-semibold text-foreground line-clamp-2 mb-1 drop-shadow-md">
            {story.title}
          </h3>

          {/* Synopsis (on hover/preview) */}
          <p
            className={`text-xs text-foreground/80 line-clamp-3 transition-all duration-300 drop-shadow-sm ${
              showOverlay ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
            }`}
          >
            {story.synopsis}
          </p>

          {/* CTA Button (on hover/preview) */}
          <div
            className={`flex items-center gap-2 mt-2 transition-all duration-300 ${
              showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg">
              <Play size={12} fill="currentColor" />
              {isPreviewing ? 'Tap to Read' : 'Read'}
            </span>
            {story.readingTimeMins && (
              <span className="text-xs text-foreground/70 drop-shadow-sm">
                {story.readingTimeMins} min
              </span>
            )}
          </div>
        </div>

        {/* Video indicator */}
        {story.posterVideo && !isPreviewing && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center shadow-md">
            <Play size={12} className="text-primary" fill="currentColor" />
          </div>
        )}

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none ring-1 ring-primary/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]" />
      </div>
    </Link>
  );
}
