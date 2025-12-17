import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PosterCard } from './PosterCard';
import { StoryMeta } from '@/types/story';

interface RowCarouselProps {
  title: string;
  stories: StoryMeta[];
  size?: 'small' | 'medium' | 'large';
}

export function RowCarousel({ title, stories, size = 'medium' }: RowCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
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
  }, [stories]);

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
    <section className="relative py-4 md:py-6">
      {/* Section Title */}
      <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-4 px-4 md:px-12">
        {title}
      </h2>

      {/* Carousel Container */}
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
    </section>
  );
}
