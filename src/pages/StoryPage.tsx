import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useStory, useLibrary } from '@/hooks/useStories';
import { ReadingProgress } from '@/components/ReadingProgress';
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

const LAST_READ_KEY = 'pageportals:lastRead';
const PROGRESS_KEY_PREFIX = 'pageportals:progress:';

type ProgressV2 = {
  pct: number; // 0..1
  scrollTop: number;
  updatedAt: number;
};

type LastReadV2 = {
  slug: string;
  pct: number; // 0..1
  updatedAt: number;
  title?: string;
  posterImage?: string;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function progressKey(slug: string) {
  return `${PROGRESS_KEY_PREFIX}${slug}`;
}

function readProgressV2(slug: string): ProgressV2 | null {
  if (typeof window === 'undefined') return null;
  const parsed = safeParseJSON<ProgressV2>(localStorage.getItem(progressKey(slug)));
  if (!parsed) return null;
  if (typeof parsed.pct !== 'number' || typeof parsed.scrollTop !== 'number') return null;
  return {
    pct: clamp01(parsed.pct),
    scrollTop: Math.max(0, parsed.scrollTop),
    updatedAt: Number(parsed.updatedAt ?? 0),
  };
}

function writeProgressV2(slug: string, data: ProgressV2, story?: { title?: string; posterImage?: string }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(progressKey(slug), JSON.stringify(data));

    const lastRead: LastReadV2 = {
      slug,
      pct: clamp01(data.pct),
      updatedAt: data.updatedAt,
      ...(story?.title ? { title: story.title } : {}),
      ...(story?.posterImage ? { posterImage: story.posterImage } : {}),
    };
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(lastRead));

    window.dispatchEvent(new Event('pageportals:progress:updated'));
  } catch {
    // ignore
  }
}

export default function StoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { story, content, loading, error } = useStory(slug || '');
  const { stories } = useLibrary();
  const { settings, updateSettings } = useReaderSettings();

  const [copied, setCopied] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgress, setSavedProgress] = useState<ProgressV2 | null>(null);
  const [moreLikeThisExpanded, setMoreLikeThisExpanded] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  // Real scroll container
  const readerRef = useRef<HTMLDivElement>(null);

  // Scroll tracking throttles
  const scrollRafRef = useRef<number | null>(null);
  const lastPctRef = useRef(0);

  // Debounced localStorage writes (~250ms)
  const pendingWriteRef = useRef<ProgressV2 | null>(null);
  const lastWriteAtRef = useRef(0);
  const writeTimerRef = useRef<number | null>(null);

  // Auto-scroll logic - scrolls the reader pane
  const autoScrollRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);

  // Resume state for this mount
  const resumeChoiceMadeRef = useRef(false);

  const flushPendingWrite = useCallback(() => {
    if (!slug) return;
    const pending = pendingWriteRef.current;
    if (!pending) return;

    pendingWriteRef.current = null;
    lastWriteAtRef.current = Date.now();
    writeProgressV2(slug, pending, story ?? undefined);
  }, [slug, story]);

  const scheduleWrite = useCallback(
    (next: ProgressV2) => {
      pendingWriteRef.current = next;

      const now = Date.now();
      const elapsed = now - lastWriteAtRef.current;

      // Only write if pct changes meaningfully
      if (Math.abs(next.pct - lastPctRef.current) <= 0.002) return;

      if (elapsed >= 250) {
        flushPendingWrite();
        return;
      }

      if (writeTimerRef.current != null) return;

      writeTimerRef.current = window.setTimeout(() => {
        writeTimerRef.current = null;
        flushPendingWrite();
      }, Math.max(0, 250 - elapsed));
    },
    [flushPendingWrite]
  );

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current != null) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = readerRef.current;
      if (!el || !slug) return;

      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? clamp01(el.scrollTop / max) : 0;

      setProgressPct(pct);

      const next: ProgressV2 = {
        pct,
        scrollTop: el.scrollTop,
        updatedAt: Date.now(),
      };

      scheduleWrite(next);
      lastPctRef.current = pct;
    });
  }, [scheduleWrite, slug]);

  // Auto-scroll logic - scrolls the reader pane
  useEffect(() => {
    const el = readerRef.current;
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

    // Reset per-mount flags
    resumeChoiceMadeRef.current = false;
    setShowResumeDialog(false);
    setSavedProgress(null);
    setProgressPct(0);
    lastPctRef.current = 0;

    // Cancel pending raf/timers
    if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = null;

    if (writeTimerRef.current != null) window.clearTimeout(writeTimerRef.current);
    writeTimerRef.current = null;
    pendingWriteRef.current = null;

    if (readerRef.current) {
      readerRef.current.scrollTop = 0;
    }

    // Collapse "More like this" on story change
    setMoreLikeThisExpanded(false);
    setContentReady(false);
  }, [slug]);

  // Mark content ready after markdown renders (wait a few frames)
  useEffect(() => {
    if (!content) return;

    let frameCount = 0;
    const maxFrames = 15;

    const waitForLayout = () => {
      frameCount++;
      const el = readerRef.current;

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

  const attemptRestoreToPct = useCallback((pct: number) => {
    const targetPct = clamp01(pct);

    let frames = 0;
    let lastH = 0;
    let stableFrames = 0;

    const tick = () => {
      frames++;
      const el = readerRef.current;
      if (!el) return;

      const h = el.scrollHeight;
      if (h === lastH) stableFrames++;
      else stableFrames = 0;

      lastH = h;

      const ready = el.scrollHeight > el.clientHeight && stableFrames >= 2;
      if (ready || frames >= 12) {
        const max = Math.max(0, el.scrollHeight - el.clientHeight);
        const top = targetPct * max;
        el.scrollTo({ top, behavior: 'auto' });

        // Second frame "stick" (Safari)
        requestAnimationFrame(() => {
          const el2 = readerRef.current;
          if (!el2) return;
          const max2 = Math.max(0, el2.scrollHeight - el2.clientHeight);
          el2.scrollTop = targetPct * max2;
        });
        return;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, []);

  // Restore resume popup + auto-resume from Continue Reading click
  useEffect(() => {
    if (!slug || !contentReady) return;

    const wantsAutoResume = Boolean((location.state as any)?.autoResume);
    const saved = readProgressV2(slug);

    setSavedProgress(saved);

    if (resumeChoiceMadeRef.current) return;

    if (wantsAutoResume && saved?.pct != null && saved.pct >= 0.01) {
      resumeChoiceMadeRef.current = true;
      attemptRestoreToPct(saved.pct);
      setShowResumeDialog(false);

      // Clear the navigation state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (saved && saved.pct >= 0.01 && saved.pct <= 0.99) {
      setShowResumeDialog(true);
    }
  }, [attemptRestoreToPct, contentReady, location.pathname, location.state, navigate, slug]);

  const handleResume = useCallback(() => {
    if (!savedProgress) return;
    resumeChoiceMadeRef.current = true;
    attemptRestoreToPct(savedProgress.pct);
    setShowResumeDialog(false);
  }, [attemptRestoreToPct, savedProgress]);

  const handleStartOver = useCallback(() => {
    if (!slug) return;
    resumeChoiceMadeRef.current = true;

    try {
      localStorage.removeItem(progressKey(slug));
      localStorage.setItem(
        LAST_READ_KEY,
        JSON.stringify({
          slug,
          pct: 0,
          updatedAt: Date.now(),
          ...(story?.title ? { title: story.title } : {}),
          ...(story?.posterImage ? { posterImage: story.posterImage } : {}),
        } satisfies LastReadV2)
      );
      window.dispatchEvent(new Event('pageportals:progress:updated'));
    } catch {
      // ignore
    }

    setSavedProgress(null);
    setProgressPct(0);

    const el = readerRef.current;
    if (el) el.scrollTo({ top: 0, behavior: 'auto' });

    setShowResumeDialog(false);
  }, [slug, story?.posterImage, story?.title]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Final flush (best-effort)
  useEffect(() => {
    return () => {
      if (!slug) return;

      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;

      if (writeTimerRef.current != null) window.clearTimeout(writeTimerRef.current);
      writeTimerRef.current = null;

      const el = readerRef.current;
      if (!el) return;

      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? clamp01(el.scrollTop / max) : 0;
      const finalData: ProgressV2 = { pct, scrollTop: el.scrollTop, updatedAt: Date.now() };
      writeProgressV2(slug, finalData, story ?? undefined);
    };
  }, [slug, story]);

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
  const fontSizeClass =
    settings.fontSize === 'S'
      ? 'text-base'
      : settings.fontSize === 'L'
        ? 'text-xl'
        : 'text-lg';

  const textColumnClass =
    settings.lineWidth === 'narrow'
      ? 'max-w-[900px]'
      : settings.lineWidth === 'wide'
        ? 'max-w-[1100px]'
        : 'max-w-[1000px]';

  const readerFramePaddingClass = settings.focusMode
    ? 'py-2 sm:py-3 md:py-4'
    : 'py-2 sm:py-3 md:py-3 lg:py-2';

  const savedPctLabel = savedProgress ? Math.round(savedProgress.pct * 100) : 0;

  return (
    // Keep dark background always - paper theme only affects reader card
    <div className="h-[100svh] flex flex-col overflow-hidden transition-colors duration-300 bg-background text-foreground">
      {/* Reading Progress Bar - fixed at top */}
      <ReadingProgress progress={progressPct * 100} />

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
              <span className="font-display text-lg font-bold hidden sm:inline">PagePortals</span>
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
            <div className="mx-auto w-full max-w-[1100px] lg:max-w-[1200px]">
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
          <div
            ref={readerRef}
            onScroll={handleScroll}
            className={`reader-pane w-full max-w-none h-full overflow-y-auto rounded-xl shadow-xl ${
              settings.theme === 'paper'
                ? 'bg-amber-50 border border-stone-300 shadow-stone-400/30'
                : 'bg-card/95 border border-border/50 shadow-black/40'
            }`}
          >
            <article className="px-5 sm:px-8 md:px-12 lg:px-16 py-6 md:py-10">
              {/* Inner content wrapper - wider text column */}
              <div className={`mx-auto w-full ${textColumnClass}`}>
                {/* Synopsis */}
                <p
                  className={`italic border-l-4 border-primary pl-4 mb-6 md:mb-8 ${fontSizeClass} ${
                    settings.theme === 'paper' ? 'text-stone-600' : 'text-muted-foreground'
                  }`}
                >
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
                <div
                  className={`reader-content max-w-none ${fontSizeClass} ${
                    settings.theme === 'paper' ? 'prose-paper' : 'prose-story'
                  }`}
                >
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
        <AlertDialogContent
          className="max-w-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Continue Reading?</AlertDialogTitle>
            <AlertDialogDescription>
              You were {savedPctLabel}% through this story. Would you like to pick up where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartOver}>Start Over</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume} autoFocus>
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
