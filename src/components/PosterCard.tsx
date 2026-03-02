import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { StoryMeta } from '@/types/story';

interface PosterCardProps {
  story: StoryMeta;
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
}

const BASE_PATH = import.meta.env.BASE_URL || '/';

const getIsTouch = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const getCanHover = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

  // Intersection observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

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

  useEffect(() => {
    const handleOtherPreview = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug: string }>;
      if (customEvent.detail.slug !== slugRef.current && isPreviewing) stopPreview();
    };
    window.addEventListener('pageportals:preview:open', handleOtherPreview);
    return () => window.removeEventListener('pageportals:preview:open', handleOtherPreview);
  }, [isPreviewing, stopPreview]);

  useEffect(() => {
    if (!isPreviewing) return;
    const handleScroll = () => stopPreview();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPreviewing, stopPreview]);

  useEffect(() => {
    if (!isPreviewing) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) stopPreview();
    };
    document.addEventListener('click', handleOutsideClick, { capture: true });
    document.addEventListener('touchstart', handleOutsideClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleOutsideClick, { capture: true });
      document.removeEventListener('touchstart', handleOutsideClick, { capture: true });
    };
  }, [isPreviewing, stopPreview]);

  useEffect(() => {
    if (!videoPath || !isVisible) return;
    if ((isHovered || isPreviewing) && !videoReady) setVideoReady(true);
  }, [isHovered, isPreviewing, isVisible, videoPath, videoReady]);

  useEffect(() => {
    if (!videoRef.current || !story.posterVideo || !videoReady) return;
    if (!getCanHover()) return;
    const video = videoRef.current;
    if (isHovered && isVisible) {
      const attemptPlay = () => { video.play().catch(() => {}); };
      if (video.readyState >= 2) attemptPlay();
      else video.addEventListener('loadeddata', attemptPlay, { once: true });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered, isVisible, story.posterVideo, videoReady]);

  const handleClick = (e: React.MouseEvent) => {
    if (getIsTouch() && videoPath) {
      if (!isPreviewing) {
        e.preventDefault();
        e.stopPropagation();
        setIsPreviewing(true);
        setVideoReady(true);
        window.dispatchEvent(new CustomEvent('pageportals:preview:open', { detail: { slug: story.slug } }));
        requestAnimationFrame(() => {
          const v = videoRef.current;
          if (!v) return;
          v.muted = true;
          (v as any).playsInline = true;
          v.play().catch(() => {});
        });
        previewTimeoutRef.current = window.setTimeout(() => stopPreview(), 4000);
        return;
      }
    }
  };

  useEffect(() => {
    return () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); };
  }, []);

  const showOverlay = isHovered || isPreviewing;

  return (
    <Link
      to={`/story/${story.slug}`}
      className="block outline-none group"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/story/${story.slug}`); }}
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
        {/* Image */}
        {isVisible && (
          <img
            src={imagePath}
            alt={story.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-110"
          />
        )}

        {/* Video Preview */}
        {videoPath && videoReady && (
          <video
            ref={videoRef}
            src={videoPath}
            muted loop playsInline preload="metadata"
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              (isHovered && videoLoaded) || isPreviewing ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Gradient - more cinematic */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          showOverlay 
            ? 'bg-gradient-to-t from-background via-background/60 to-background/20 opacity-90' 
            : 'bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-100'
        }`} />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          {/* Genre Chip - top */}
          <span className="genre-chip self-start mb-auto mt-2 opacity-80 text-[10px]">{story.genre}</span>

          {/* Title */}
          <h3 className="font-display text-sm md:text-base font-semibold text-foreground line-clamp-2 mb-1 drop-shadow-lg">
            {story.title}
          </h3>

          {/* Reading time - always visible */}
          {story.readingTimeMins && (
            <div className={`flex items-center gap-1 text-[10px] text-foreground/50 mb-1 transition-opacity duration-300 ${showOverlay ? 'opacity-0 h-0' : 'opacity-100'}`}>
              <Clock size={10} />
              <span>{story.readingTimeMins} min</span>
            </div>
          )}

          {/* Synopsis (on hover) */}
          <p className={`text-xs text-foreground/70 line-clamp-3 transition-all duration-300 drop-shadow-sm ${
            showOverlay ? 'opacity-100 max-h-20 mb-2' : 'opacity-0 max-h-0'
          }`}>
            {story.synopsis}
          </p>

          {/* CTA (on hover) */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${
            showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg shadow-primary/20">
              <Play size={12} fill="currentColor" />
              {isPreviewing ? 'Tap to Read' : 'Read'}
            </span>
            {story.readingTimeMins && (
              <span className="text-[10px] text-foreground/60 flex items-center gap-1">
                <Clock size={10} />
                {story.readingTimeMins} min
              </span>
            )}
          </div>
        </div>

        {/* Video indicator */}
        {story.posterVideo && !isPreviewing && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Play size={10} className="text-primary" fill="currentColor" />
          </div>
        )}

        {/* Hover border glow */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none ring-1 ring-primary/20" />
      </div>
    </Link>
  );
}
