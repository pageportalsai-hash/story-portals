import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { StoryMeta } from '@/types/story';

interface HeroSectionProps {
  story: StoryMeta;
}

const BASE_PATH = import.meta.env.BASE_URL || '/';

export function HeroSection({ story }: HeroSectionProps) {
  const imagePath = story.posterImage.startsWith('/')
    ? `${BASE_PATH}${story.posterImage.slice(1)}`
    : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

  return (
    <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={imagePath}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-12 max-w-4xl">
        {/* Featured Label */}
        <span className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-4 animate-fade-in">
          <span className="w-8 h-0.5 bg-primary" />
          Featured Story
        </span>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 animate-slide-up">
          {story.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <span className="genre-chip">{story.genre}</span>
          {story.year && (
            <span className="text-muted-foreground text-sm">{story.year}</span>
          )}
          {story.readingTimeMins && (
            <span className="text-muted-foreground text-sm">
              {story.readingTimeMins} min read
            </span>
          )}
          {story.author && (
            <span className="text-muted-foreground text-sm">
              by {story.author}
            </span>
          )}
        </div>

        {/* Synopsis */}
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mb-6 line-clamp-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {story.synopsis}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <Link
            to={`/story/${story.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <Play size={20} fill="currentColor" />
            Read Now
          </Link>
          <Link
            to={`/story/${story.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background"
          >
            <Info size={20} />
            More Info
          </Link>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
          {story.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
