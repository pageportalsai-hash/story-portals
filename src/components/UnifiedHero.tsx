import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, HelpCircle, Info, ChevronDown } from 'lucide-react';
import { StoryMeta } from '@/types/story';
import { HowItWorksModal } from './HowItWorksModal';

interface UnifiedHeroProps {
  story: StoryMeta;
}

const BASE_PATH = import.meta.env.BASE_URL || '/';

export function UnifiedHero({ story }: UnifiedHeroProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

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
      {/* Spacer for fixed header */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-top)+3rem)] md:h-[calc(4rem+env(safe-area-inset-top))]" />
      
      <section className="relative min-h-[calc(90vh-7rem)] md:min-h-[calc(100vh-4rem)] w-full overflow-hidden -mt-[calc(3.5rem+env(safe-area-inset-top)+3rem)] md:-mt-[calc(4rem+env(safe-area-inset-top))]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={imagePath}
            alt={story.title}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-cover scale-105 animate-[heroZoom_20s_ease-in-out_infinite_alternate]"
          />
          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
          {/* Subtle vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.6) 100%)' }} />
        </div>

        {/* Content Container */}
        <div className="relative h-full flex flex-col justify-center items-center pt-[calc(6rem+env(safe-area-inset-top))] md:pt-24 px-4 md:px-12">
          {/* Intro Block */}
          <div className="max-w-3xl text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              AI-Generated Stories
            </div>

            <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in leading-[1.1] tracking-tight">
              Step into the mind
              <span className="block text-primary">of the machine.</span>
            </h2>

            <p className="text-foreground/70 text-base md:text-lg mb-8 leading-relaxed animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: '100ms' }}>
              A robot-generated library of sci-fi, fantasy, and noir novellas—every cover is a portal to another world. 
              Discover beauty, horror, and wonder crafted by artificial minds.
            </p>

            <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <button
                onClick={scrollToTrending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <Play size={18} fill="currentColor" />
                Start Reading
              </button>
              <button
                onClick={() => setHowItWorksOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground/10 backdrop-blur-sm text-foreground font-semibold rounded-full hover:bg-foreground/20 transition-all border border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                <HelpCircle size={18} />
                How it works
              </button>
            </div>
          </div>

          {/* Featured Story Block */}
          <div className="w-full max-w-4xl pb-12 md:pb-16 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="bg-foreground/5 backdrop-blur-xl rounded-2xl p-5 md:p-8 border border-foreground/10 hover:border-primary/20 transition-colors duration-500">
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider mb-2">
                    <span className="w-5 h-0.5 bg-primary rounded-full" />
                    Featured Story
                  </span>

                  <h3 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 line-clamp-2">
                    {story.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="genre-chip text-xs">{story.genre}</span>
                    {story.year && <span className="text-foreground/40 text-xs">{story.year}</span>}
                    {story.readingTimeMins && <span className="text-foreground/40 text-xs">{story.readingTimeMins} min read</span>}
                  </div>

                  <p className="text-foreground/50 text-sm line-clamp-2 mb-4">
                    {story.synopsis}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4 md:mb-0">
                    {story.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] text-foreground/40 bg-foreground/5 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: CTAs */}
                <div className="flex md:flex-col gap-2 md:items-end flex-shrink-0">
                  <Link
                    to={`/story/${story.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:bg-primary/90 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Play size={14} fill="currentColor" />
                    Read Now
                  </Link>
                  <Link
                    to={`/story/${story.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground/10 text-foreground font-medium text-sm rounded-full hover:bg-foreground/20 transition-colors border border-foreground/15"
                  >
                    <Info size={14} />
                    Details
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={scrollToTrending}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-foreground/30 hover:text-foreground/60 transition-colors"
            aria-label="Scroll to stories"
          >
            <ChevronDown size={28} />
          </button>
        </div>
      </section>

      <HowItWorksModal open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
    </>
  );
}
