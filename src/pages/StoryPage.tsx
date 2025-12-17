import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useStory, useLibrary } from '@/hooks/useStories';
import { ReadingProgress } from '@/components/ReadingProgress';
import { useReadingProgressTracker, getStoryProgress, getStoryScrollPosition, clearStoryProgress } from '@/hooks/useReadingProgress';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StorySkeleton } from '@/components/StorySkeleton';
import { StoryError } from '@/components/StoryError';
import { ReaderSettings } from '@/components/ReaderSettings';
import { MoreLikeThis } from '@/components/MoreLikeThis';
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  User,
  Calendar,
  PlayCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback, useLayoutEffect } from 'react';

const BASE_PATH = import.meta.env.BASE_URL || '/';

export default function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { story, content, loading, error } = useStory(slug || '');
  const { stories } = useLibrary();
  const { settings, updateSettings, getReaderClasses, getThemeClasses } = useReaderSettings();
  const [copied, setCopied] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);

  // Track reading progress to localStorage
  useReadingProgressTracker(slug);

  // Scroll to top before paint to prevent flash
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [slug]);

  // Check for existing progress on mount
  useEffect(() => {
    if (slug) {
      const progress = getStoryProgress(slug);
      if (progress > 5 && progress < 95) {
        setSavedProgress(progress);
        setShowResumePrompt(true);
      }
    }
  }, [slug]);

  const handleResume = useCallback(() => {
    if (slug) {
      const scrollPos = getStoryScrollPosition(slug);
      window.scrollTo({ top: scrollPos, behavior: 'smooth' });
      setShowResumePrompt(false);
    }
  }, [slug]);

  const handleStartOver = useCallback(() => {
    if (slug) {
      clearStoryProgress(slug);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowResumePrompt(false);
  }, [slug]);

  const handleDismissResume = useCallback(() => {
    setShowResumePrompt(false);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Show skeleton immediately while loading
  if (loading) {
    return <StorySkeleton />;
  }

  // Show error UI
  if (error) {
    return <StoryError stories={stories} type="load-error" />;
  }

  if (!story) {
    return <StoryError stories={stories} type="not-found" />;
  }

  const imagePath = story.posterImage.startsWith('/')
    ? `${BASE_PATH}${story.posterImage.slice(1)}`
    : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;

  const themeClasses = getThemeClasses();
  const readerClasses = getReaderClasses();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      <ReadingProgress />
      
      {/* Header - hidden in focus mode */}
      {!settings.focusMode && <Header stories={stories} showSearch={false} />}

      {/* Hero Banner */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={imagePath}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${
          settings.theme === 'paper' 
            ? 'from-amber-50 via-amber-50/60 to-transparent' 
            : 'from-background via-background/60 to-transparent'
        }`} />
      </div>

      {/* Resume Prompt */}
      {showResumePrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl shadow-lg backdrop-blur-sm">
            <PlayCircle size={20} className="text-primary" />
            <span className="text-sm text-foreground">
              Resume from {savedProgress}%?
            </span>
            <button
              onClick={handleResume}
              className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Resume
            </button>
            <button
              onClick={handleStartOver}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Story Content */}
      <main className="relative z-10 -mt-32 md:-mt-48 px-4 md:px-0">
        <article className={`mx-auto ${readerClasses}`}>
          {/* Back Link - hidden in focus mode */}
          {!settings.focusMode && (
            <Link
              to="/"
              className={`inline-flex items-center gap-2 transition-colors mb-6 ${
                settings.theme === 'paper' 
                  ? 'text-stone-500 hover:text-stone-700' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeft size={16} />
              Back to Library
            </Link>
          )}

          {/* Title */}
          <h1 className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-slide-up ${
            settings.theme === 'paper' ? 'text-stone-900' : 'text-foreground'
          }`}>
            {story.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <span className="genre-chip">{story.genre}</span>
            {story.year && (
              <span className={`flex items-center gap-1 text-sm ${
                settings.theme === 'paper' ? 'text-stone-500' : 'text-muted-foreground'
              }`}>
                <Calendar size={14} />
                {story.year}
              </span>
            )}
            {story.readingTimeMins && (
              <span className={`flex items-center gap-1 text-sm ${
                settings.theme === 'paper' ? 'text-stone-500' : 'text-muted-foreground'
              }`}>
                <Clock size={14} />
                {story.readingTimeMins} min read
              </span>
            )}
            {story.author && (
              <span className={`flex items-center gap-1 text-sm ${
                settings.theme === 'paper' ? 'text-stone-500' : 'text-muted-foreground'
              }`}>
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
                className={`text-xs px-2 py-1 rounded ${
                  settings.theme === 'paper' 
                    ? 'text-stone-500 bg-stone-200/50' 
                    : 'text-muted-foreground bg-muted/50'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className={`text-lg italic border-l-4 border-primary pl-4 mb-8 animate-slide-up ${
            settings.theme === 'paper' ? 'text-stone-600' : 'text-muted-foreground'
          }`} style={{ animationDelay: '200ms' }}>
            {story.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                settings.theme === 'paper'
                  ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
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
            
            <ReaderSettings settings={settings} onUpdate={updateSettings} />
          </div>

          {/* Story Content */}
          <div 
            className={`animate-fade-in ${
              settings.theme === 'paper' ? 'prose-paper' : 'prose-story'
            }`} 
            style={{ animationDelay: '300ms' }}
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>

          {/* More Like This */}
          {stories.length > 1 && (
            <MoreLikeThis currentStory={story} allStories={stories} />
          )}
        </article>
      </main>

      {/* Footer - hidden in focus mode */}
      {!settings.focusMode && <Footer />}
    </div>
  );
}
