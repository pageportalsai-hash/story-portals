import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, HelpCircle, CreditCard, Info } from 'lucide-react';
import { StoryMeta } from '@/types/story';
import { HowItWorksModal } from './HowItWorksModal';
import { PricingModal } from './PricingModal';

interface UnifiedHeroProps {
  story: StoryMeta;
}

const BASE_PATH = import.meta.env.BASE_URL || '/';

export function UnifiedHero({ story }: UnifiedHeroProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const imagePath = story.posterImage.startsWith('/')
    ? `${BASE_PATH}${story.posterImage.slice(1)}`
    : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

  const scrollToTrending = () => {
    const trendingSection = document.getElementById('trending-now');
    if (trendingSection) {
      trendingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Spacer for fixed header - accounts for header height + safe area */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-top)+3rem)] md:h-[calc(4rem+env(safe-area-inset-top))]" />
      
      <section className="relative min-h-[calc(90vh-7rem)] md:min-h-[calc(100vh-4rem)] w-full overflow-hidden -mt-[calc(3.5rem+env(safe-area-inset-top)+3rem)] md:-mt-[calc(4rem+env(safe-area-inset-top))]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={imagePath}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          {/* Strong gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/40 to-background/60" />
          <div className="absolute inset-0 bg-background/30" />
        </div>

        {/* Content Container - extra top padding on mobile for header+search */}
        <div className="relative h-full flex flex-col justify-center items-center pt-[calc(6rem+env(safe-area-inset-top))] md:pt-24 px-4 md:px-12">
          {/* Intro Block - Centered Primary Hero */}
          <div className="max-w-3xl text-center mb-16 md:mb-20">
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              Step into the mind of the machine.
            </h2>

            <p className="text-foreground/80 text-lg md:text-xl mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
              PagePortals is a robot-generated library of sci-fi, fantasy, and noir novellas—every cover is a portal to another world. 
              Discover beauty, horror, and wonder crafted by artificial minds. 
              As you read, you may find yourself questioning: is this sentience, or simply exquisite glitches?
            </p>

            <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <button
                onClick={scrollToTrending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <Play size={18} fill="currentColor" />
                Start Reading
              </button>
              <button
                onClick={() => setHowItWorksOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground/10 backdrop-blur-sm text-foreground font-semibold rounded-lg hover:bg-foreground/20 transition-colors border border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <HelpCircle size={18} />
                How it works
              </button>
              <button
                onClick={() => setPricingOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground/10 backdrop-blur-sm text-foreground font-semibold rounded-lg hover:bg-foreground/20 transition-colors border border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <CreditCard size={18} />
                Pricing
              </button>
            </div>
          </div>

          {/* Featured Story Block - Secondary, Smaller */}
          <div className="w-full max-w-5xl pb-12 md:pb-16 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="bg-foreground/5 backdrop-blur-md rounded-xl p-6 md:p-8 border border-foreground/10">
              {/* Featured Label */}
              <span className="inline-flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider mb-3">
                <span className="w-6 h-0.5 bg-primary" />
                Featured Story
              </span>

              {/* Title - Smaller than intro */}
              <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                {story.title}
              </h3>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="genre-chip text-xs">{story.genre}</span>
                {story.year && (
                  <span className="text-foreground/50 text-sm">{story.year}</span>
                )}
                {story.readingTimeMins && (
                  <span className="text-foreground/50 text-sm">
                    {story.readingTimeMins} min read
                  </span>
                )}
                {story.author && (
                  <span className="text-foreground/50 text-sm">
                    by {story.author}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              <p className="text-foreground/60 text-sm md:text-base max-w-2xl mb-5 line-clamp-2">
                {story.synopsis}
              </p>

              {/* CTAs - Smaller buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/story/${story.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  <Play size={16} fill="currentColor" />
                  Read Now
                </Link>
                <Link
                  to={`/story/${story.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-foreground/10 text-foreground font-semibold text-sm rounded-lg hover:bg-foreground/20 transition-colors border border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/50 focus:ring-offset-2 focus:ring-offset-background"
                >
                  <Info size={16} />
                  More Info
                </Link>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {story.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-foreground/50 bg-foreground/5 px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksModal open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  );
}
