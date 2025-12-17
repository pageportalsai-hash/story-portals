import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useStory, useLibrary, useStoryNavigation } from '@/hooks/useStories';
import { ReadingProgress } from '@/components/ReadingProgress';
import { useReadingProgressTracker } from '@/hooks/useReadingProgress';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Clock,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

const BASE_PATH = import.meta.env.BASE_URL || '/';

export default function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { story, content, loading, error } = useStory(slug || '');
  const { stories } = useLibrary();
  const { prevStory, nextStory } = useStoryNavigation(slug || '', stories);
  const [copied, setCopied] = useState(false);

  // Track reading progress to localStorage
  useReadingProgressTracker(slug);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-background">
        <Header stories={stories} showSearch={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <h1 className="font-display text-4xl text-foreground mb-4">Story Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The story you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Library
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const imagePath = story.posterImage.startsWith('/')
    ? `${BASE_PATH}${story.posterImage.slice(1)}`
    : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

  return (
    <div className="min-h-screen bg-background">
      <ReadingProgress />
      <Header stories={stories} showSearch={false} />

      {/* Hero Banner */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={imagePath}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Story Content */}
      <main className="relative z-10 -mt-32 md:-mt-48 px-4 md:px-0">
        <article className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Library
          </Link>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 animate-slide-up">
            {story.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <span className="genre-chip">{story.genre}</span>
            {story.year && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar size={14} />
                {story.year}
              </span>
            )}
            {story.readingTimeMins && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock size={14} />
                {story.readingTimeMins} min read
              </span>
            )}
            {story.author && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <User size={14} />
                {story.author}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            {story.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {story.synopsis}
          </p>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors mb-8 animate-slide-up"
            style={{ animationDelay: '250ms' }}
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-500" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Link
              </>
            )}
          </button>

          {/* Story Content */}
          <div className="prose-story animate-fade-in" style={{ animationDelay: '300ms' }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>

          {/* Navigation */}
          <nav className="flex items-center justify-between border-t border-border mt-16 pt-8">
            {prevStory ? (
              <Link
                to={`/story/${prevStory.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <div className="text-right">
                  <span className="block text-xs text-muted-foreground">Previous</span>
                  <span className="block font-medium">{prevStory.title}</span>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextStory ? (
              <Link
                to={`/story/${nextStory.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group text-right"
              >
                <div>
                  <span className="block text-xs text-muted-foreground">Next</span>
                  <span className="block font-medium">{nextStory.title}</span>
                </div>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </article>
      </main>

      <Footer />
    </div>
  );
}
