import { useState } from 'react';
import { Play, HelpCircle, CreditCard } from 'lucide-react';
import { HowItWorksModal } from './HowItWorksModal';
import { PricingModal } from './PricingModal';

export function IntroSection() {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const scrollToTrending = () => {
    const trendingSection = document.getElementById('trending-now');
    if (trendingSection) {
      trendingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="relative py-16 md:py-24 px-4 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Step into the mind of the machine.
          </h2>

          {/* Hype paragraph */}
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            PagePortals is a robot-generated library of sci-fi, fantasy, and noir novellas—every cover is a portal to another world. 
            Discover beauty, horror, and wonder crafted by artificial minds. 
            As you read, you may find yourself questioning: is this sentience, or simply exquisite glitches?
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <button
              onClick={scrollToTrending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <Play size={20} fill="currentColor" />
              Start Reading
            </button>
            <button
              onClick={() => setHowItWorksOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background"
            >
              <HelpCircle size={20} />
              How it works
            </button>
            <button
              onClick={() => setPricingOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground font-semibold rounded-lg hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-2 focus:ring-offset-background"
            >
              <CreditCard size={20} />
              Pricing
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      </section>

      <HowItWorksModal open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  );
}
