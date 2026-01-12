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
  List,
  ChevronRight,
} from 'lucide-react';
import { ReaderSettings } from '@/hooks/useReaderSettings';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PROGRESS_KEY_PREFIX = 'pageportals:progress:';
const VOICE_KEY = 'pageportals:ttsVoiceName';

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

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

// Voice scoring heuristic
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();
  const uri = voice.voiceURI.toLowerCase();
  const combined = `${name} ${uri}`;

  // Language bonuses
  if (voice.lang === 'en-US') score += 30;
  else if (voice.lang.startsWith('en-')) score += 15;

  // Tier A keywords (+100 each)
  const tierA = ['neural', 'natural', 'online', 'enhanced', 'premium'];
  tierA.forEach((kw) => {
    if (combined.includes(kw)) score += 100;
  });

  // Tier B keywords (+40 each)
  const tierB = ['microsoft', 'google', 'siri', 'apple', 'azure', 'aria', 'jenny', 'guy'];
  tierB.forEach((kw) => {
    if (combined.includes(kw)) score += 40;
  });

  // Tier C keywords (+20 each)
  const tierC = ['united states', 'english (united states)', 'en-us'];
  tierC.forEach((kw) => {
    if (combined.includes(kw)) score += 20;
  });

  // Penalty keywords (-60 each)
  const penalties = ['default', 'compact', 'basic', 'legacy', 'espeak'];
  penalties.forEach((kw) => {
    if (combined.includes(kw)) score -= 60;
  });

  // Extra penalty for "default" in name
  if (name.includes('default')) score -= 25;

  return score;
}

function getBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  
  // Filter to English voices first
  const englishVoices = voices.filter((v) => v.lang.startsWith('en-'));
  const candidateVoices = englishVoices.length > 0 ? englishVoices : voices;
  
  let best = candidateVoices[0];
  let bestScore = scoreVoice(best);

  for (let i = 1; i < candidateVoices.length; i++) {
    const score = scoreVoice(candidateVoices[i]);
    if (score > bestScore) {
      best = candidateVoices[i];
      bestScore = score;
    }
  }

  return best;
}

function preprocessTextForSpeech(text: string): string {
  // Trim and collapse multiple spaces
  let processed = text.trim().replace(/\s+/g, ' ');
  // Ensure ends with punctuation
  if (processed.length > 0 && !/[.?!]$/.test(processed)) {
    processed += '.';
  }
  return processed;
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

function slugify(text: string, index: number): string {
  return `toc-${index}-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)}`;
}

export function TopReaderBar({ settings, onUpdate, contentRef, readerRef, slug }: TopReaderBarProps) {
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [startMode, setStartMode] = useState<TtsStartMode>('top');
  const [savedTtsIndex, setSavedTtsIndex] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('auto');
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [tocOpen, setTocOpen] = useState(false);

  const blocksRef = useRef<BlockChunk[]>([]);
  const currentIndexRef = useRef(0);
  const activeElRef = useRef<HTMLElement | null>(null);
  const lastUserScrollRef = useRef(0);

  // Check TTS support and load voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setTtsSupported(false);
      return;
    }
    setTtsSupported(true);

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Load saved voice preference
      const savedVoice = localStorage.getItem(VOICE_KEY);
      if (savedVoice && availableVoices.find((v) => v.name === savedVoice)) {
        setSelectedVoiceName(savedVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
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

  // Build TOC from rendered content
  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      setTocEntries([]);
      return;
    }

    // Wait a bit for content to render
    const timer = setTimeout(() => {
      const headings = el.querySelectorAll('h1, h2, h3') as NodeListOf<HTMLElement>;
      const entries: TocEntry[] = [];

      headings.forEach((heading, index) => {
        const text = (heading.textContent || '').trim();
        if (text.length === 0) return;

        // Generate or use existing id
        let id = heading.id;
        if (!id) {
          id = slugify(text, index);
          heading.id = id;
        }

        const level = parseInt(heading.tagName.charAt(1), 10);
        entries.push({ id, text, level });
      });

      setTocEntries(entries);
    }, 500);

    return () => clearTimeout(timer);
  }, [contentRef, slug]);

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

  const getSelectedVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (selectedVoiceName === 'auto') {
      return getBestVoice(voices);
    }
    return voices.find((v) => v.name === selectedVoiceName) || getBestVoice(voices);
  }, [selectedVoiceName, voices]);

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

    // Preprocess text for better pacing
    const processedText = preprocessTextForSpeech(block.text);

    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.rate = 1;
    utterance.pitch = 1;

    // Set voice
    const voice = getSelectedVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      // Short pause between blocks for pacing
      setTimeout(() => {
        speakBlock(index + 1);
      }, 150);
    };
    utterance.onerror = (e) => {
      // Ignore 'interrupted' errors (happens on cancel)
      if (e.error !== 'interrupted') {
        setTtsState('idle');
        clearHighlight();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [autoScrollToBlock, clearHighlight, getSelectedVoice, highlightBlock, slug]);

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

  const handleVoiceChange = useCallback((voiceName: string) => {
    setSelectedVoiceName(voiceName);
    if (voiceName === 'auto') {
      localStorage.removeItem(VOICE_KEY);
    } else {
      localStorage.setItem(VOICE_KEY, voiceName);
    }
  }, []);

  const handleChapterClick = useCallback((id: string) => {
    const heading = contentRef.current?.querySelector(`#${id}`) as HTMLElement;
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  }, [contentRef]);

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
  const startModeBtn = (mode: TtsStartMode) =>
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

        {/* Chapters TOC */}
        {tocEntries.length > 0 && (
          <Popover open={tocOpen} onOpenChange={setTocOpen}>
            <PopoverTrigger asChild>
              <button className={btnClass} title="Table of Contents">
                <List size={14} />
                <span className="hidden sm:inline">Chapters</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-80 overflow-y-auto p-2" align="start">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Table of Contents
              </div>
              <div className="space-y-1">
                {tocEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleChapterClick(entry.id)}
                    className={`w-full text-left text-sm py-1.5 px-2 rounded hover:bg-muted/60 transition-colors flex items-center gap-1.5 ${
                      entry.level === 2 ? 'pl-4' : entry.level === 3 ? 'pl-6' : ''
                    }`}
                  >
                    <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="line-clamp-2">{entry.text}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* TTS Controls */}
        {ttsSupported && (
          <div className="flex items-center gap-1 ml-auto">
            {/* Voice selector - only show when idle and voices exist */}
            {ttsState === 'idle' && voices.length > 1 && (
              <div className="hidden lg:block">
                <Select value={selectedVoiceName} onValueChange={handleVoiceChange}>
                  <SelectTrigger className="h-7 text-xs w-32 bg-secondary/80 border-0">
                    <SelectValue placeholder="Voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="auto" className="text-xs">
                      Best (Auto)
                    </SelectItem>
                    {voices
                      .filter((v) => v.lang.startsWith('en-'))
                      .slice(0, 15)
                      .map((v) => (
                        <SelectItem key={v.name} value={v.name} className="text-xs">
                          {v.name.replace('Microsoft ', '').replace('Google ', '').slice(0, 25)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Start mode selector - only show when idle */}
            {ttsState === 'idle' && (
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <span className="text-xs text-muted-foreground mr-1">Start:</span>
                <button
                  onClick={() => setStartMode('top')}
                  className={startModeBtn('top')}
                  title="Start from beginning"
                >
                  <RotateCcw size={10} />
                  Top
                </button>
                <button
                  onClick={() => setStartMode('here')}
                  className={startModeBtn('here')}
                  title="Start from current position"
                >
                  <MapPin size={10} />
                  Here
                </button>
                {savedTtsIndex !== null && savedTtsIndex > 0 && (
                  <button
                    onClick={() => setStartMode('last')}
                    className={startModeBtn('last')}
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

      {/* Voice quality helper note - show when TTS is available but idle */}
      {ttsSupported && ttsState === 'idle' && (
        <div className="px-3 pb-2 -mt-1">
          <p className="text-[10px] text-muted-foreground/60 hidden lg:block">
            Voice quality depends on your browser/OS. For better free voices, try Microsoft Edge or install enhanced system voices.
          </p>
        </div>
      )}
    </div>
  );
}
