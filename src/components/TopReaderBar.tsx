import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Type,
  Moon,
  Sun,
  Focus,
  Volume2,
  Play,
  Pause,
  Square,
  Minus,
  Plus,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { ReaderSettings } from '@/hooks/useReaderSettings';

const PROGRESS_KEY_PREFIX = 'pageportals:progress:';

type TtsStartMode = 'top' | 'here' | 'last';

interface TopReaderBarProps {
  settings: ReaderSettings;
  onUpdate: (updates: Partial<ReaderSettings>) => void;
  contentRef: React.RefObject<HTMLElement>;
  readerRef?: React.RefObject<HTMLElement>;
  slug?: string;
}

interface BlockChunk {
  el: HTMLElement;
  text: string;
}

function readSavedTtsIndex(slug: string): number | null {
  if (typeof window === 'undefined' || !slug) return null;
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.ttsIndex === 'number' && parsed.ttsIndex >= 0) {
      return parsed.ttsIndex;
    }
  } catch {}
  return null;
}

function saveTtsIndex(slug: string, ttsIndex: number) {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const key = `${PROGRESS_KEY_PREFIX}${slug}`;
    const raw = localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : {};
    const updated = {
      ...existing,
      ttsIndex,
      ttsUpdatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

export function TopReaderBar({ settings, onUpdate, contentRef, readerRef, slug }: TopReaderBarProps) {
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [startMode, setStartMode] = useState<TtsStartMode>('top');
  const [savedTtsIndex, setSavedTtsIndex] = useState<number | null>(null);

  const blocksRef = useRef<BlockChunk[]>([]);
  const currentIndexRef = useRef(0);
  const activeElRef = useRef<HTMLElement | null>(null);
  const lastUserScrollRef = useRef(0);

  // Check TTS support
  useEffect(() => {
    setTtsSupported('speechSynthesis' in window);
  }, []);

  // Load saved TTS index when slug changes
  useEffect(() => {
    if (!slug) {
      setSavedTtsIndex(null);
      return;
    }
    const saved = readSavedTtsIndex(slug);
    setSavedTtsIndex(saved);
    // Default to 'last' if saved audio exists
    if (saved !== null && saved > 0) {
      setStartMode('last');
    } else {
      setStartMode('top');
    }
  }, [slug]);

  // Cleanup TTS on unmount or slug change
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      clearHighlight();
    };
  }, [slug]);

  // Listen for user scroll to temporarily disable auto-scroll
  useEffect(() => {
    const container = readerRef?.current;
    if (!container) return;

    const handleUserScroll = () => {
      lastUserScrollRef.current = Date.now();
    };

    container.addEventListener('wheel', handleUserScroll, { passive: true });
    container.addEventListener('touchstart', handleUserScroll, { passive: true });
    container.addEventListener('mousedown', handleUserScroll);

    return () => {
      container.removeEventListener('wheel', handleUserScroll);
      container.removeEventListener('touchstart', handleUserScroll);
      container.removeEventListener('mousedown', handleUserScroll);
    };
  }, [readerRef]);

  const clearHighlight = useCallback(() => {
    if (activeElRef.current) {
      activeElRef.current.removeAttribute('data-tts-active');
      activeElRef.current = null;
    }
  }, []);

  const highlightBlock = useCallback((el: HTMLElement) => {
    clearHighlight();
    el.setAttribute('data-tts-active', 'true');
    activeElRef.current = el;
  }, [clearHighlight]);

  const autoScrollToBlock = useCallback((el: HTMLElement) => {
    const container = readerRef?.current;
    if (!container) return;

    // Skip auto-scroll if user scrolled recently (within 5 seconds)
    if (Date.now() - lastUserScrollRef.current < 5000) return;

    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Only scroll if block is out of view
    if (rect.top < containerRect.top + 60 || rect.bottom > containerRect.bottom - 80) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [readerRef]);

  const buildBlocks = useCallback((): BlockChunk[] => {
    const el = contentRef.current;
    if (!el) return [];

    const elements = Array.from(el.querySelectorAll('p, li, blockquote, h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    return elements
      .map((element) => ({
        el: element,
        text: (element.textContent || '').trim(),
      }))
      .filter((chunk) => chunk.text.length > 0);
  }, [contentRef]);

  const findFirstVisibleBlockIndex = useCallback((): number => {
    const container = readerRef?.current;
    if (!container) return 0;

    const blocks = blocksRef.current;
    if (blocks.length === 0) return 0;

    const containerRect = container.getBoundingClientRect();

    for (let i = 0; i < blocks.length; i++) {
      const rect = blocks[i].el.getBoundingClientRect();
      // Block is visible if its top is within the container viewport
      if (rect.top >= containerRect.top && rect.top < containerRect.bottom) {
        return i;
      }
    }

    return 0;
  }, [readerRef]);

  const speakBlock = useCallback((index: number) => {
    const blocks = blocksRef.current;
    if (index >= blocks.length) {
      setTtsState('idle');
      currentIndexRef.current = 0;
      clearHighlight();
      return;
    }

    const block = blocks[index];
    currentIndexRef.current = index;

    // Highlight and auto-scroll
    highlightBlock(block.el);
    autoScrollToBlock(block.el);

    // Save TTS position
    if (slug) {
      saveTtsIndex(slug, index);
    }

    const utterance = new SpeechSynthesisUtterance(block.text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      speakBlock(index + 1);
    };
    utterance.onerror = (e) => {
      // Ignore 'interrupted' errors (happens on cancel)
      if (e.error !== 'interrupted') {
        setTtsState('idle');
        clearHighlight();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [autoScrollToBlock, clearHighlight, highlightBlock, slug]);

  const getStartIndex = useCallback((): number => {
    switch (startMode) {
      case 'last':
        return savedTtsIndex ?? 0;
      case 'here':
        return findFirstVisibleBlockIndex();
      case 'top':
      default:
        return 0;
    }
  }, [startMode, savedTtsIndex, findFirstVisibleBlockIndex]);

  const handleTtsPlay = useCallback(() => {
    if (!ttsSupported) return;

    if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
      return;
    }

    // Build blocks list
    const blocks = buildBlocks();
    if (blocks.length === 0) return;

    blocksRef.current = blocks;

    const startIndex = getStartIndex();
    const validStartIndex = Math.min(startIndex, blocks.length - 1);

    window.speechSynthesis.cancel();
    setTtsState('playing');
    speakBlock(validStartIndex);
  }, [ttsSupported, ttsState, buildBlocks, getStartIndex, speakBlock]);

  const handleTtsPause = useCallback(() => {
    if (ttsState === 'playing') {
      window.speechSynthesis.pause();
      setTtsState('paused');
    }
  }, [ttsState]);

  const handleTtsStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setTtsState('idle');
    currentIndexRef.current = 0;
    clearHighlight();
  }, [clearHighlight]);

  const cycleFontSize = useCallback(() => {
    const sizes: Array<'S' | 'M' | 'L'> = ['S', 'M', 'L'];
    const idx = sizes.indexOf(settings.fontSize);
    const next = sizes[(idx + 1) % sizes.length];
    onUpdate({ fontSize: next });
  }, [settings.fontSize, onUpdate]);

  const decreaseFontSize = useCallback(() => {
    const sizes: Array<'S' | 'M' | 'L'> = ['S', 'M', 'L'];
    const idx = sizes.indexOf(settings.fontSize);
    if (idx > 0) onUpdate({ fontSize: sizes[idx - 1] });
  }, [settings.fontSize, onUpdate]);

  const increaseFontSize = useCallback(() => {
    const sizes: Array<'S' | 'M' | 'L'> = ['S', 'M', 'L'];
    const idx = sizes.indexOf(settings.fontSize);
    if (idx < sizes.length - 1) onUpdate({ fontSize: sizes[idx + 1] });
  }, [settings.fontSize, onUpdate]);

  const btnClass =
    'inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded-md transition-colors bg-secondary/80 hover:bg-secondary text-secondary-foreground';
  const activeBtnClass =
    'inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded-md transition-colors bg-primary text-primary-foreground';
  const startModeBtn = (mode: TtsStartMode, label: string, icon?: React.ReactNode) =>
    `inline-flex items-center justify-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
      startMode === mode
        ? 'bg-primary/20 text-primary border border-primary/30'
        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <div className="flex-shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2 overflow-x-auto">
        {/* Font Size Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={decreaseFontSize}
            className={btnClass}
            title="Decrease font size"
            disabled={settings.fontSize === 'S'}
          >
            <Minus size={12} />
          </button>
          <button
            onClick={cycleFontSize}
            className={btnClass}
            title="Font size"
          >
            <Type size={14} />
            <span className="font-medium">{settings.fontSize}</span>
          </button>
          <button
            onClick={increaseFontSize}
            className={btnClass}
            title="Increase font size"
            disabled={settings.fontSize === 'L'}
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => onUpdate({ theme: settings.theme === 'dark' ? 'paper' : 'dark' })}
          className={btnClass}
          title={`Switch to ${settings.theme === 'dark' ? 'paper' : 'dark'} theme`}
        >
          {settings.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span className="hidden sm:inline">{settings.theme === 'dark' ? 'Paper' : 'Dark'}</span>
        </button>

        {/* Focus Mode Toggle */}
        <button
          onClick={() => onUpdate({ focusMode: !settings.focusMode })}
          className={settings.focusMode ? activeBtnClass : btnClass}
          title="Focus mode"
        >
          <Focus size={14} />
          <span className="hidden sm:inline">Focus</span>
        </button>

        {/* TTS Controls */}
        {ttsSupported && (
          <div className="flex items-center gap-1 ml-auto">
            {/* Start mode selector - only show when idle */}
            {ttsState === 'idle' && (
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <span className="text-xs text-muted-foreground mr-1">Start:</span>
                <button
                  onClick={() => setStartMode('top')}
                  className={startModeBtn('top', 'Top')}
                  title="Start from beginning"
                >
                  <RotateCcw size={10} />
                  Top
                </button>
                <button
                  onClick={() => setStartMode('here')}
                  className={startModeBtn('here', 'Here')}
                  title="Start from current position"
                >
                  <MapPin size={10} />
                  Here
                </button>
                {savedTtsIndex !== null && savedTtsIndex > 0 && (
                  <button
                    onClick={() => setStartMode('last')}
                    className={startModeBtn('last', 'Last audio')}
                    title="Resume from last audio position"
                  >
                    <Play size={10} />
                    Last
                  </button>
                )}
              </div>
            )}

            {ttsState === 'idle' && (
              <button
                onClick={handleTtsPlay}
                className={btnClass}
                title="Read to me"
              >
                <Volume2 size={14} />
                <span className="hidden sm:inline">Read to me</span>
              </button>
            )}
            {ttsState === 'playing' && (
              <>
                <button
                  onClick={handleTtsPause}
                  className={activeBtnClass}
                  title="Pause"
                >
                  <Pause size={14} />
                </button>
                <button
                  onClick={handleTtsStop}
                  className={btnClass}
                  title="Stop"
                >
                  <Square size={14} />
                </button>
              </>
            )}
            {ttsState === 'paused' && (
              <>
                <button
                  onClick={handleTtsPlay}
                  className={btnClass}
                  title="Resume"
                >
                  <Play size={14} />
                </button>
                <button
                  onClick={handleTtsStop}
                  className={btnClass}
                  title="Stop"
                >
                  <Square size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
