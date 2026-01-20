import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PosterCard } from './PosterCard';
import { StoryMeta } from '@/types/story';
import { Skeleton } from '@/components/ui/skeleton';

interface RowCarouselProps {
  title: string;
  stories: StoryMeta[];
  size?: 'small' | 'medium' | 'large';
  subtitle?: string;
}

// Skeleton placeholder for inactive rows
function RowSkeleton({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-36 h-52 md:w-40 md:h-56',
    medium: 'w-44 h-64 md:w-52 md:h-72',
    large: 'w-56 h-80 md:w-64 md:h-96',
  };
  
  return (
    <div className="flex gap-3 px-4 md:px-12">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className={`${sizeClasses[size]} rounded-lg flex-shrink-0`} />
      ))}
    </div>
  );
}

export function RowCarousel({ title, stories, size = 'medium', subtitle }: RowCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Activate row when near viewport (progressive loading)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px' } // Activate 800px before entering viewport
    );

    if (rowRef.current) {
      observer.observe(rowRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    if (!isActive) return;
    
    checkScrollButtons();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
    }
    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', checkScrollButtons);
      }
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [stories, isActive]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (stories.length === 0) return null;

  return (
    <section ref={rowRef} className="relative py-4 md:py-6">
      {/* Section Title */}
      <div className="flex items-baseline gap-3 mb-4 px-4 md:px-12">
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
          {title}
        </h2>
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
      </div>

      {/* Show skeleton until row is active */}
      {!isActive ? (
        <RowSkeleton size={size} />
      ) : (
        /* Carousel Container */
        <div className="relative group">
          {/* Left Chevron */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="carousel-chevron left-2 md:left-4 opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="carousel-row px-4 md:px-12"
          >
            {stories.map((story, index) => (
              <div key={story.slug} className="carousel-item">
                <PosterCard story={story} size={size} priority={index < 4} />
              </div>
            ))}
          </div>

          {/* Right Chevron */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="carousel-chevron right-2 md:right-4 opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </section>
  );
}
