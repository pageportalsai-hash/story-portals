import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useStory, useLibrary } from '@/hooks/useStories';
import { ReadingProgress } from '@/components/ReadingProgress';
import { useReadingProgressTracker, getStoryProgress, getStoryScrollPosition, clearStoryProgress } from '@/hooks/useReadingProgress';
import { useReaderSettings } from '@/hooks/useReaderSettings';
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
  BookOpen,
} from 'lucide-react';
import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';

const BASE_PATH = import.meta.env.BASE_URL || '/';

export default function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { story, content, loading, error } = useStory(slug || '');
  const { stories } = useLibrary();
  const { settings, updateSettings, getReaderClasses, getThemeClasses } = useReaderSettings();
  const [copied, setCopied] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [moreLikeThisExpanded, setMoreLikeThisExpanded] = useState(false);
  
  // Ref for the reader pane (scrollable container)
  const readerPaneRef = useRef<HTMLDivElement>(null);

  // Track reading progress using the reader pane scroll
  const progress = useReadingProgressTracker(slug, readerPaneRef);

  // Scroll reader pane to top on slug change
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (readerPaneRef.current) {
      readerPaneRef.current.scrollTop = 0;
    }
    // Collapse "More like this" on story change
    setMoreLikeThisExpanded(false);
  }, [slug]);

  // Check for existing progress on mount
  useEffect(() => {
    if (slug) {
      const existingProgress = getStoryProgress(slug);
      if (existingProgress > 5 && existingProgress < 95) {
        setSavedProgress(existingProgress);
        setShowResumePrompt(true);
      }
    }
  }, [slug]);

  const handleResume = useCallback(() => {
    if (slug && readerPaneRef.current) {
      const scrollPos = getStoryScrollPosition(slug);
      readerPaneRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
      setShowResumePrompt(false);
    }
  }, [slug]);

  const handleStartOver = useCallback(() => {
    if (slug) {
      clearStoryProgress(slug);
    }
    if (readerPaneRef.current) {
      readerPaneRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setShowResumePrompt(false);
  }, [slug]);

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

  const themeClasses = getThemeClasses();
  const readerClasses = getReaderClasses();

  return (
    <div className={`h-[100svh] flex flex-col overflow-hidden transition-colors duration-300 ${themeClasses}`}>
      {/* Reading Progress Bar - fixed at top */}
      <ReadingProgress progress={progress} />
      
      {/* Fixed Header with Branding */}
      <header className={`flex-shrink-0 border-b pt-[env(safe-area-inset-top)] ${
        settings.theme === 'paper' ? 'border-stone-200 bg-amber-50' : 'border-border bg-background'
      }`}>
        <div className="flex items-center justify-between px-4 md:px-8 h-14">
          {/* Left: Logo + Back */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <BookOpen size={24} className="text-primary" />
              <span className="font-display text-lg font-bold hidden sm:inline">
                PagePortals
              </span>
            </Link>
            
            <span className={`hidden sm:block w-px h-6 ${
              settings.theme === 'paper' ? 'bg-stone-300' : 'bg-border'
            }`} />
            
            <Link
              to="/"
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                settings.theme === 'paper' 
                  ? 'text-stone-500 hover:text-stone-700' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Library</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                settings.theme === 'paper'
                  ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-500" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>
            
            <ReaderSettings settings={settings} onUpdate={updateSettings} />
          </div>
        </div>

        {/* Story Title Bar - below nav */}
        {!settings.focusMode && (
          <div className={`px-4 md:px-8 py-3 border-t ${
            settings.theme === 'paper' ? 'border-stone-200/50' : 'border-border/50'
          }`}>
            <div className="max-w-3xl mx-auto">
              <h1 className={`font-display text-lg md:text-xl font-bold mb-1 line-clamp-1 ${
                settings.theme === 'paper' ? 'text-stone-900' : 'text-foreground'
              }`}>
                {story.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="genre-chip text-xs">{story.genre}</span>
                {story.year && (
                  <span className={`flex items-center gap-1 text-xs ${
                    settings.theme === 'paper' ? 'text-stone-500' : 'text-muted-foreground'
                  }`}>
                    <Calendar size={12} />
                    {story.year}
                  </span>
                )}
                {story.readingTimeMins && (
                  <span className={`flex items-center gap-1 text-xs ${
                    settings.theme === 'paper' ? 'text-stone-500' : 'text-muted-foreground'
                  }`}>
                    <Clock size={12} />
                    {story.readingTimeMins} min
                  </span>
                )}
                {story.author && (
                  <span className={`hidden sm:flex items-center gap-1 text-xs ${
                    settings.theme === 'paper' ? 'text-stone-500' : 'text-muted-foreground'
                  }`}>
                    <User size={12} />
                    {story.author}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Reader Area - flex-1 to fill remaining space */}
      <main className="flex-1 min-h-0 flex flex-col">
        {/* Reader Frame Container - no grey stage, just centered card */}
        <div className="flex-1 min-h-0 flex justify-center p-2 sm:p-4 md:p-6">
          {/* Recessed Reader Frame - centered, constrained width */}
          <div
            ref={readerPaneRef}
            className={`reader-pane w-full max-w-3xl h-full overflow-y-auto rounded-xl shadow-xl ${
              settings.theme === 'paper' 
                ? 'bg-amber-50 border border-stone-300 shadow-stone-400/30' 
                : 'bg-card/95 border border-border/50 shadow-black/40'
            }`}
          >
            <article className={`px-5 sm:px-8 md:px-12 py-6 md:py-10 ${readerClasses}`}>
              {/* Synopsis */}
              <p className={`text-base md:text-lg italic border-l-4 border-primary pl-4 mb-6 md:mb-8 ${
                settings.theme === 'paper' ? 'text-stone-600' : 'text-muted-foreground'
              }`}>
                {story.synopsis}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
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

              {/* Story Content */}
              <div className={`reader-content ${
                settings.theme === 'paper' ? 'prose-paper' : 'prose-story'
              }`}>
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>

              {/* Bottom padding so last paragraphs aren't hidden */}
              <div className="h-16 md:h-8" />
            </article>
          </div>
        </div>

        {/* More Like This - Collapsible on mobile, always visible on desktop */}
        {stories.length > 1 && !settings.focusMode && (
          <div className={`flex-shrink-0 border-t ${
            settings.theme === 'paper' 
              ? 'border-stone-200 bg-amber-50' 
              : 'border-border bg-background'
          }`}>
            <MoreLikeThis 
              currentStory={story} 
              allStories={stories} 
              compact 
              collapsible
              expanded={moreLikeThisExpanded}
              onToggle={() => setMoreLikeThisExpanded(!moreLikeThisExpanded)}
            />
          </div>
        )}
      </main>

      {/* Resume Prompt */}
      {showResumePrompt && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-slide-up px-4 w-full max-w-md">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm ${
            settings.theme === 'paper'
              ? 'bg-stone-100 border border-stone-300'
              : 'bg-card border border-border'
          }`}>
            <PlayCircle size={20} className="text-primary flex-shrink-0" />
            <span className={`text-sm flex-1 ${
              settings.theme === 'paper' ? 'text-stone-700' : 'text-foreground'
            }`}>
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
              className={`px-3 py-1 text-sm transition-colors ${
                settings.theme === 'paper' 
                  ? 'text-stone-500 hover:text-stone-700' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}