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
      <section className="relative min-h-[90vh] md:min-h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={imagePath}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          {/* Strong gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-background/30" />
        </div>

        {/* Content Container */}
        <div className="relative h-full flex flex-col pt-24 md:pt-32 px-4 md:px-12">
          {/* Intro Block */}
          <div className="max-w-4xl mb-12 md:mb-16">
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              Step into the mind of the machine.
            </h2>

            <p className="text-foreground/80 text-lg md:text-xl max-w-3xl mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
              PagePortals is a robot-generated library of sci-fi, fantasy, and noir novellas—every cover is a portal to another world. 
              Discover beauty, horror, and wonder crafted by artificial minds. 
              As you read, you may find yourself questioning: is this sentience, or simply exquisite glitches?
            </p>

            <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
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

          {/* Divider */}
          <div className="w-24 h-0.5 bg-primary/50 mb-8 md:mb-12 animate-fade-in" style={{ animationDelay: '300ms' }} />

          {/* Featured Story Block */}
          <div className="max-w-4xl pb-16 md:pb-24">
            {/* Featured Label */}
            <span className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-4 animate-fade-in" style={{ animationDelay: '350ms' }}>
              <span className="w-8 h-0.5 bg-primary" />
              Featured Story
            </span>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
              {story.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mb-4 animate-slide-up" style={{ animationDelay: '450ms' }}>
              <span className="genre-chip">{story.genre}</span>
              {story.year && (
                <span className="text-foreground/60 text-sm">{story.year}</span>
              )}
              {story.readingTimeMins && (
                <span className="text-foreground/60 text-sm">
                  {story.readingTimeMins} min read
                </span>
              )}
              {story.author && (
                <span className="text-foreground/60 text-sm">
                  by {story.author}
                </span>
              )}
            </div>

            {/* Synopsis */}
            <p className="text-foreground/70 text-base md:text-lg max-w-2xl mb-6 line-clamp-3 animate-slide-up" style={{ animationDelay: '500ms' }}>
              {story.synopsis}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '550ms' }}>
              <Link
                to={`/story/${story.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <Play size={20} fill="currentColor" />
                Read Now
              </Link>
              <Link
                to={`/story/${story.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground/10 backdrop-blur-sm text-foreground font-semibold rounded-lg hover:bg-foreground/20 transition-colors border border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <Info size={20} />
                More Info
              </Link>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4 animate-slide-up" style={{ animationDelay: '600ms' }}>
              {story.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-foreground/60 bg-foreground/10 backdrop-blur-sm px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HowItWorksModal open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  );
}
