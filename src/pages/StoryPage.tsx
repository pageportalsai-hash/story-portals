import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useStory, useLibrary } from '@/hooks/useStories';
import { ReadingProgress } from '@/components/ReadingProgress';
import { useReadingProgressTracker, getStoryProgress, getStoryScrollPosition, clearStoryProgress, saveReadingProgress } from '@/hooks/useReadingProgress';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import { StorySkeleton } from '@/components/StorySkeleton';
import { StoryError } from '@/components/StoryError';
import { ReaderSettings } from '@/components/ReaderSettings';
import { MoreLikeThis } from '@/components/MoreLikeThis';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  User,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';

export default function StoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { story, content, loading, error } = useStory(slug || '');
  const { stories } = useLibrary();
  const { settings, updateSettings } = useReaderSettings();
  const [copied, setCopied] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [moreLikeThisExpanded, setMoreLikeThisExpanded] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  
  // Ref for the reader pane (scrollable container)
  const readerPaneRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);

  // Track reading progress using the reader pane scroll
  const progress = useReadingProgressTracker(slug, readerPaneRef);

  // Auto-scroll logic - scrolls the reader pane
  useEffect(() => {
    const el = readerPaneRef.current;
    if (!el) return;

    // Stop any existing animation
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }

    if (!settings.autoScroll) return;

    // Speed 1 = 20px/sec, Speed 10 = 200px/sec
    const pixelsPerSecond = 20 + (settings.autoScrollSpeed - 1) * 20;
    let lastTime = performance.now();
    userInteractedRef.current = false;

    const scroll = (currentTime: number) => {
      if (userInteractedRef.current) {
        // User interacted, stop auto-scroll
        updateSettings({ autoScroll: false });
        return;
      }

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const maxScroll = el.scrollHeight - el.clientHeight;
      if (el.scrollTop >= maxScroll) {
        // Reached the end, stop
        updateSettings({ autoScroll: false });
        return;
      }

      el.scrollTop += pixelsPerSecond * deltaTime;
      autoScrollRef.current = requestAnimationFrame(scroll);
    };

    autoScrollRef.current = requestAnimationFrame(scroll);

    // Pause on user interaction
    const handleUserInteraction = () => {
      userInteractedRef.current = true;
    };

    el.addEventListener('wheel', handleUserInteraction, { passive: true });
    el.addEventListener('touchstart', handleUserInteraction, { passive: true });
    el.addEventListener('mousedown', handleUserInteraction);

    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
      el.removeEventListener('wheel', handleUserInteraction);
      el.removeEventListener('touchstart', handleUserInteraction);
      el.removeEventListener('mousedown', handleUserInteraction);
    };
  }, [settings.autoScroll, settings.autoScrollSpeed, updateSettings]);

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
    setContentReady(false);
  }, [slug]);

  // Mark content ready after markdown renders and wait for layout to stabilize
  useEffect(() => {
    if (!content) return;
    
    // Wait for layout to stabilize
    let frameCount = 0;
    const maxFrames = 15;
    
    const waitForLayout = () => {
      frameCount++;
      const el = readerPaneRef.current;
      
      if (el && el.scrollHeight > el.clientHeight) {
        setContentReady(true);
        return;
      }
      
      if (frameCount < maxFrames) {
        requestAnimationFrame(waitForLayout);
      } else {
        setContentReady(true);
      }
    };
    
    requestAnimationFrame(waitForLayout);
  }, [content]);

  // Check for existing progress on mount - show dialog only if not auto-resuming
  useEffect(() => {
    if (!slug || !contentReady) return;
    
    const wantsAutoResume = Boolean((location.state as any)?.resume);
    if (wantsAutoResume) return; // Don't show dialog if auto-resuming
    
    const existingProgress = getStoryProgress(slug);
    if (existingProgress > 1 && existingProgress < 95) {
      setSavedProgress(existingProgress);
      setShowResumeDialog(true);
    }
  }, [slug, contentReady, location.state]);

  // Scroll helper that reliably scrolls the reader pane
  const scrollReaderTo = useCallback((scrollTop: number, behavior: ScrollBehavior = 'auto') => {
    const el = readerPaneRef.current;
    if (!el) return;
    
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const clampedTop = Math.max(0, Math.min(scrollTop, maxScroll));
    
    if (behavior === 'auto') {
      el.scrollTop = clampedTop;
      // Force a second assignment to ensure it sticks
      requestAnimationFrame(() => {
        if (readerPaneRef.current) {
          readerPaneRef.current.scrollTop = clampedTop;
        }
      });
    } else {
      el.scrollTo({ top: clampedTop, behavior });
    }
  }, []);

  // If user clicked "Resume" from Home with state, auto-restore position
  useEffect(() => {
    const wantsAutoResume = Boolean((location.state as any)?.resume);
    if (!wantsAutoResume || !slug || !contentReady) return;

    const scrollPos = getStoryScrollPosition(slug);
    if (scrollPos > 0) {
      scrollReaderTo(scrollPos, 'auto');
    }
    
    // Clear the navigation state to prevent re-triggering
    navigate(location.pathname, { replace: true, state: {} });
  }, [contentReady, location.state, location.pathname, navigate, scrollReaderTo, slug]);

  const handleResume = useCallback(() => {
    if (!slug) return;
    const scrollPos = getStoryScrollPosition(slug);
    scrollReaderTo(scrollPos, 'auto');
    setShowResumeDialog(false);
  }, [slug, scrollReaderTo]);

  const handleStartOver = useCallback(() => {
    if (slug) clearStoryProgress(slug);
    scrollReaderTo(0, 'auto');
    setShowResumeDialog(false);
  }, [slug, scrollReaderTo]);

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

  // Get font size and line width classes separately
  const fontSizeClass = settings.fontSize === 'S' ? 'text-base' : settings.fontSize === 'L' ? 'text-xl' : 'text-lg';
  const lineWidthClass = settings.lineWidth === 'narrow' ? 'max-w-xl' : settings.lineWidth === 'wide' ? 'max-w-3xl' : 'max-w-2xl';
  const readerFramePaddingClass = settings.focusMode
    ? 'py-2 sm:py-3 md:py-4'
    : 'py-2 sm:py-3 md:py-3 lg:py-2';

  return (
    // Keep dark background always - paper theme only affects reader card
    <div className="h-[100svh] flex flex-col overflow-hidden transition-colors duration-300 bg-background text-foreground">
      {/* Reading Progress Bar - fixed at top */}
      <ReadingProgress progress={progress} />
      
      {/* Fixed Header with Branding */}
      <header className="flex-shrink-0 border-b pt-[env(safe-area-inset-top)] border-border bg-background">
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
            
            <span className="hidden sm:block w-px h-6 bg-border" />
            
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm transition-colors text-muted-foreground hover:text-foreground"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
          <div className="px-4 md:px-8 py-3">
            <div className="max-w-3xl mx-auto">
              <h1 className="font-display text-lg md:text-xl font-bold mb-1 line-clamp-1 text-foreground">
                {story.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="genre-chip text-xs">{story.genre}</span>
                {story.year && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {story.year}
                  </span>
                )}
                {story.readingTimeMins && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {story.readingTimeMins} min
                  </span>
                )}
                {story.author && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
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
        {/* Reader Frame Container - clean, no border/outline */}
        <div className={`flex-1 min-h-0 flex justify-center px-2 sm:px-4 md:px-6 ${readerFramePaddingClass}`}>
          {/* Recessed Reader Frame - centered, wider on desktop */}
          {/* Normal mode: max-w-6xl for comfortable reading width */}
          {/* Focus mode: max-w-4xl (tighter focus) */}
          <div
            ref={readerPaneRef}
            className={`reader-pane w-full h-full overflow-y-auto rounded-xl shadow-xl ${
              settings.focusMode ? 'max-w-4xl' : 'max-w-6xl'
            } ${
              settings.theme === 'paper' 
                ? 'bg-amber-50 border border-stone-300 shadow-stone-400/30' 
                : 'bg-card/95 border border-border/50 shadow-black/40'
            }`}
          >
            <article className="px-5 sm:px-8 md:px-12 lg:px-16 py-6 md:py-10">
              {/* Inner content wrapper - controls line width */}
              <div className={`mx-auto ${lineWidthClass}`}>
                {/* Synopsis */}
                <p className={`italic border-l-4 border-primary pl-4 mb-6 md:mb-8 ${fontSizeClass} ${
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

                {/* Story Content - font size applies here */}
                <div className={`reader-content ${fontSizeClass} ${
                  settings.theme === 'paper' ? 'prose-paper' : 'prose-story'
                }`}>
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>

                {/* Bottom padding so last paragraphs aren't hidden */}
                <div className="h-16 md:h-8" />
              </div>
            </article>
          </div>
        </div>

        {/* More Like This - Collapsible on mobile, always visible on desktop */}
        {stories.length > 1 && !settings.focusMode && (
          <div className="flex-shrink-0 bg-background">
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

      {/* Resume Dialog - proper modal that works immediately */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Continue Reading?</AlertDialogTitle>
            <AlertDialogDescription>
              You were {savedProgress}% through this story. Would you like to pick up where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartOver}>
              Start Over
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume} autoFocus>
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
