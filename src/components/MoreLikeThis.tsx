import { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { PosterCard } from './PosterCard';
import { StoryMeta } from '@/types/story';
import { useIsMobile } from '@/hooks/use-mobile';

interface MoreLikeThisProps {
  currentStory: StoryMeta;
  allStories: StoryMeta[];
  compact?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function MoreLikeThis({ 
  currentStory, 
  allStories, 
  compact = false,
  collapsible = false,
  expanded = true,
  onToggle,
}: MoreLikeThisProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isMobile = useIsMobile();

  // On mobile with collapsible, default to collapsed unless explicitly expanded
  const isCollapsed = collapsible && isMobile && !expanded;

  const similarStories = useMemo(() => {
    // Filter out current story
    const others = allStories.filter((s) => s.slug !== currentStory.slug);

    // Score each story based on similarity
    const scored = others.map((story) => {
      let score = 0;

      // Genre match (highest weight)
      if (story.genre.toLowerCase() === currentStory.genre.toLowerCase()) {
        score += 100;
      }

      // Tag overlap (medium weight)
      const currentTags = new Set(currentStory.tags.map((t) => t.toLowerCase()));
      const matchingTags = story.tags.filter((t) => currentTags.has(t.toLowerCase()));
      score += matchingTags.length * 20;

      // Reading time similarity (lower weight)
      if (currentStory.readingTimeMins && story.readingTimeMins) {
        const timeDiff = Math.abs(currentStory.readingTimeMins - story.readingTimeMins);
        // Closer reading times get higher scores
        score += Math.max(0, 10 - timeDiff);
      }

      return { story, score };
    });

    // Sort by score descending and take top 8
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.story);
  }, [currentStory, allStories]);

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
  }, [similarStories, expanded]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (similarStories.length === 0) return null;

  return (
    <section className={compact ? 'py-2 md:py-4' : 'py-8 md:py-12'}>
      {/* Header - clickable on mobile when collapsible */}
      <button
        onClick={collapsible && isMobile ? onToggle : undefined}
        disabled={!collapsible || !isMobile}
        className={`w-full flex items-center justify-between px-4 md:px-8 mb-2 ${
          collapsible && isMobile ? 'cursor-pointer active:opacity-70' : 'cursor-default'
        }`}
      >
        <h2 className={`font-display font-semibold text-foreground ${
          compact ? 'text-sm md:text-lg' : 'text-xl md:text-2xl'
        }`}>
          More Like This
        </h2>
        {collapsible && isMobile && (
          <span className="text-muted-foreground p-1">
            {isCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        )}
      </button>

      {/* Content - collapsible on mobile */}
      {!isCollapsed && (
        <div className="relative group">
          {/* Left Chevron */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="carousel-chevron left-2 md:left-4 opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={compact ? 18 : 24} />
          </button>

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="carousel-row px-4 md:px-8"
          >
            {similarStories.map((story, index) => (
              <div key={story.slug} className="carousel-item">
                <PosterCard story={story} size="small" priority={index < 4} />
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
            <ChevronRight size={compact ? 18 : 24} />
          </button>
        </div>
      )}
    </section>
  );
}