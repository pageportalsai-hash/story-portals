import { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PosterCard } from './PosterCard';
import { StoryMeta } from '@/types/story';

interface MoreLikeThisProps {
  currentStory: StoryMeta;
  allStories: StoryMeta[];
}

export function MoreLikeThis({ currentStory, allStories }: MoreLikeThisProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [similarStories]);

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
    <section className="py-8 md:py-12">
      <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-6">
        More Like This
      </h2>

      <div className="relative group -mx-4 md:mx-0">
        {/* Left Chevron */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="carousel-chevron left-2 md:left-0 opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="carousel-row px-4 md:px-0"
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
          className="carousel-chevron right-2 md:right-0 opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
}
