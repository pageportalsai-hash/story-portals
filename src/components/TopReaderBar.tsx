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
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
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
const RATE_KEY = 'pageportals:ttsRate';
const WPM = 220;

type TtsStartMode = 'top' | 'here' | 'last';

interface TopReaderBarProps {
  settings: ReaderSettings;
  onUpdate: (updates: Partial<ReaderSettings>) => void;
  contentRef: React.RefObject<HTMLElement>;
  readerRef?: React.RefObject<HTMLElement>;
  slug?: string;
  progressPct?: number;
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

interface SearchMatch {
  el: HTMLElement;
  originalHTML: string;
}

// Voices to EXCLUDE (novelty/sound effects/robotic/silly)
const EXCLUDED_VOICE_KEYWORDS = [
  // Apple novelty voices
  'bad news', 'bells', 'boing', 'bubbles', 'cellos', 'trinoids', 'whisper',
  'hysterical', 'deranged', 'wobble', 'organ', 'zarvox', 'bahh', 'albert',
  'jester', 'good news', 'pipe organ', 'superstar', 'ralph', 'kathy',
  'junior', 'bruce', 'fred', 'princess', 'agnes', 'vicki', 'eddy',
  'grandma', 'grandpa', 'whispered',
  // Generic exclusions  
  'novelty', 'sound effect', 'sfx', 'test', 'demo',
  // More Apple oddities
  'alex', 'victoria', 'xander', 'yelda', 'zosia', 'damayanti',
  // Foreign language indicators (we only want English)
  'mandarin', 'cantonese', 'hindi', 'japanese', 'korean', 'arabic',
  'russian', 'polish', 'thai', 'vietnamese', 'indonesian', 'malay',
  'czech', 'danish', 'dutch', 'finnish', 'greek', 'hebrew', 'hungarian',
  'norwegian', 'portuguese', 'romanian', 'slovak', 'swedish', 'turkish',
  'ukrainian', 'catalan', 'croatian', 'french', 'german', 'italian', 'spanish'
];

// Voice scoring heuristic for narration quality
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();
  const uri = voice.voiceURI.toLowerCase();
  const combined = `${name} ${uri}`;

  // Exclude novelty voices entirely
  if (EXCLUDED_VOICE_KEYWORDS.some(kw => combined.includes(kw))) {
    return -1000;
  }

  // Language bonuses
  if (voice.lang === 'en-US') score += 50;
  else if (voice.lang === 'en-GB') score += 45;
  else if (voice.lang.startsWith('en-')) score += 30;
  else return -500; // Non-English penalty

  // Tier A keywords - high quality voices (+100 each)
  const tierA = ['neural', 'natural', 'online', 'enhanced', 'premium'];
  tierA.forEach((kw) => {
    if (combined.includes(kw)) score += 100;
  });

  // Tier B keywords - good quality (+40 each)
  const tierB = ['microsoft', 'google', 'siri', 'apple', 'azure', 'aria', 'jenny', 'guy', 'samantha', 'daniel', 'karen', 'moira', 'fiona', 'tessa'];
  tierB.forEach((kw) => {
    if (combined.includes(kw)) score += 40;
  });

  // Tier C keywords - acceptable (+15 each)
  const tierC = ['united states', 'united kingdom', 'english (united states)', 'english (united kingdom)', 'en-us', 'en-gb'];
  tierC.forEach((kw) => {
    if (combined.includes(kw)) score += 15;
  });

  // Penalty keywords (-60 each)
  const penalties = ['compact', 'basic', 'legacy', 'espeak'];
  penalties.forEach((kw) => {
    if (combined.includes(kw)) score -= 60;
  });

  return score;
}

// Filter to only narration-capable English voices
function getNarrationVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter(v => {
      const name = v.name.toLowerCase();
      const uri = v.voiceURI.toLowerCase();
      const combined = `${name} ${uri}`;
      
      // Must be English
      if (!v.lang.startsWith('en-')) return false;
      
      // Exclude novelty voices
      if (EXCLUDED_VOICE_KEYWORDS.some(kw => combined.includes(kw))) return false;
      
      return true;
    })
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

function getBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const narrationVoices = getNarrationVoices(voices);
  if (narrationVoices.length === 0) {
    // Fallback to any English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
    return englishVoices[0] || voices[0] || null;
  }
  return narrationVoices[0];
}

// Format voice name for display
function formatVoiceName(voice: SpeechSynthesisVoice): string {
  let name = voice.name;
  
  // Remove common prefixes
  name = name.replace(/^Microsoft\s+/i, '');
  name = name.replace(/^Google\s+/i, '');
  name = name.replace(/^Apple\s+/i, '');
  
  // Add language indicator
  const langSuffix = voice.lang === 'en-GB' ? ' (UK)' 
    : voice.lang === 'en-US' ? ' (US)' 
    : voice.lang === 'en-AU' ? ' (AU)'
    : '';
  
  // Truncate if too long
  if (name.length > 20) {
    name = name.slice(0, 18) + '…';
  }
  
  return name + langSuffix;
}

// Split text into smaller chunks for smoother, less robotic playback
function splitIntoSentences(text: string): string[] {
  // Split by sentence-ending punctuation but keep the punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    // Keep chunks between 50-300 chars for natural pacing
    if (current.length + trimmed.length < 300) {
      current += (current ? ' ' : '') + trimmed;
    } else {
      if (current) chunks.push(current);
      current = trimmed;
    }
  }
  if (current) chunks.push(current);
  
  return chunks.length > 0 ? chunks : [text.trim()];
}

function preprocessTextForSpeech(text: string): string {
  let processed = text.trim().replace(/\s+/g, ' ');
  // Remove markdown artifacts
  processed = processed.replace(/[*_#`]/g, '');
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

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function TopReaderBar({ settings, onUpdate, contentRef, readerRef, slug, progressPct = 0 }: TopReaderBarProps) {
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [startMode, setStartMode] = useState<TtsStartMode>('top');
  const [savedTtsIndex, setSavedTtsIndex] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [narrationVoices, setNarrationVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('auto');
  const [ttsRate, setTtsRate] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.95;
    const saved = localStorage.getItem(RATE_KEY);
    return saved ? parseFloat(saved) : 0.95;
  });
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  
  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  
  // Time left state
  const [totalWords, setTotalWords] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      
      // Filter to narration-capable voices
      const narration = getNarrationVoices(availableVoices);
      setNarrationVoices(narration);
      
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
    if (saved !== null && saved > 0) {
      setStartMode('last');
    } else {
      setStartMode('top');
    }
  }, [slug]);

  // Calculate total words when content is ready
  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      setTotalWords(0);
      return;
    }

    const timer = setTimeout(() => {
      const text = el.textContent || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setTotalWords(words);
    }, 300);

    return () => clearTimeout(timer);
  }, [contentRef, slug]);

  // Build TOC from rendered content
  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      setTocEntries([]);
      return;
    }

    const timer = setTimeout(() => {
      const headings = el.querySelectorAll('h1, h2, h3') as NodeListOf<HTMLElement>;
      const entries: TocEntry[] = [];

      headings.forEach((heading, index) => {
        const text = (heading.textContent || '').trim();
        if (text.length === 0) return;

        let id = heading.id;
        if (!id) {
          id = slugify(text, index);
          heading.id = id;
        }

        const level = parseInt(heading.tagName.charAt(1), 10);
        entries.push({ id, text, level });
      });

      setTocEntries(entries);
    }, 300);

    return () => clearTimeout(timer);
  }, [contentRef, slug]);

  // Cleanup TTS on unmount or slug change
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      clearHighlight();
      clearSearchHighlights();
    };
  }, [slug]);

  // Listen for user scroll
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

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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

    if (Date.now() - lastUserScrollRef.current < 5000) return;

    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

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

    highlightBlock(block.el);
    autoScrollToBlock(block.el);

    if (slug) {
      saveTtsIndex(slug, index);
    }

    const processedText = preprocessTextForSpeech(block.text);
    // Split into sentence-level chunks for natural pacing
    const sentences = splitIntoSentences(processedText);
    let sentenceIndex = 0;

    const speakNextSentence = () => {
      if (sentenceIndex >= sentences.length) {
        // Done with this block, move to next with a brief pause
        setTimeout(() => {
          speakBlock(index + 1);
        }, 120);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex]);
      utterance.rate = ttsRate;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voice = getSelectedVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        sentenceIndex++;
        // Tiny gap between sentences for natural pacing
        setTimeout(speakNextSentence, 40);
      };
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          setTtsState('idle');
          clearHighlight();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  }, [autoScrollToBlock, clearHighlight, getSelectedVoice, highlightBlock, slug, ttsRate]);

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

  const startPlayback = useCallback(() => {
    const blocks = buildBlocks();
    if (blocks.length === 0) return;

    blocksRef.current = blocks;

    const startIndex = getStartIndex();
    const validStartIndex = Math.min(startIndex, blocks.length - 1);

    window.speechSynthesis.cancel();
    setTtsState('playing');
    speakBlock(validStartIndex);
  }, [buildBlocks, getStartIndex, speakBlock]);

  const handleTtsPlay = useCallback(() => {
    if (!ttsSupported) return;

    if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
      return;
    }

    startPlayback();
  }, [ttsSupported, ttsState, startPlayback]);

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

  const handleRateChange = useCallback((newRate: number) => {
    const clamped = Math.max(0.5, Math.min(1.5, newRate));
    setTtsRate(clamped);
    localStorage.setItem(RATE_KEY, String(clamped));
  }, []);

  const handleChapterClick = useCallback((id: string) => {
    const heading = contentRef.current?.querySelector(`#${id}`) as HTMLElement;
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  }, [contentRef]);

  // Search functionality
  const clearSearchHighlights = useCallback(() => {
    searchMatches.forEach(({ el, originalHTML }) => {
      el.innerHTML = originalHTML;
    });
    setSearchMatches([]);
    setActiveMatchIndex(0);
  }, [searchMatches]);

  const performSearch = useCallback((query: string) => {
    clearSearchHighlights();
    
    if (!query.trim() || !contentRef.current) {
      return;
    }

    const el = contentRef.current;
    const textElements = el.querySelectorAll('p, li, blockquote, h1, h2, h3, h4, h5, h6') as NodeListOf<HTMLElement>;
    const newMatches: SearchMatch[] = [];
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');

    textElements.forEach((textEl) => {
      const text = textEl.innerHTML;
      if (regex.test(text)) {
        newMatches.push({ el: textEl, originalHTML: text });
        textEl.innerHTML = text.replace(regex, '<mark class="search-hit">$1</mark>');
      }
      regex.lastIndex = 0;
    });

    setSearchMatches(newMatches);
    
    if (newMatches.length > 0) {
      setActiveMatchIndex(0);
      const firstMark = el.querySelector('mark.search-hit');
      if (firstMark) {
        firstMark.classList.add('search-hit-active');
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [clearSearchHighlights, contentRef]);

  const goToMatch = useCallback((index: number) => {
    if (!contentRef.current || searchMatches.length === 0) return;

    const marks = contentRef.current.querySelectorAll('mark.search-hit');
    if (marks.length === 0) return;

    marks.forEach((m) => m.classList.remove('search-hit-active'));

    const newIndex = ((index % marks.length) + marks.length) % marks.length;
    setActiveMatchIndex(newIndex);

    const activeMark = marks[newIndex];
    if (activeMark) {
      activeMark.classList.add('search-hit-active');
      activeMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [contentRef, searchMatches.length]);

  const handleSearchClose = useCallback(() => {
    clearSearchHighlights();
    setSearchQuery('');
    setSearchOpen(false);
  }, [clearSearchHighlights]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        goToMatch(activeMatchIndex - 1);
      } else {
        const marks = contentRef.current?.querySelectorAll('mark.search-hit');
        if (marks && marks.length > 0) {
          goToMatch(activeMatchIndex + 1);
        } else {
          performSearch(searchQuery);
        }
      }
    } else if (e.key === 'Escape') {
      handleSearchClose();
    }
  }, [activeMatchIndex, contentRef, goToMatch, handleSearchClose, performSearch, searchQuery]);

  // Calculate time left
  const remainingWords = Math.round(totalWords * (1 - progressPct));
  const minutesLeft = Math.max(1, Math.round(remainingWords / WPM));

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

  // Search UI takes over when open
  if (searchOpen) {
    const matchCount = contentRef.current?.querySelectorAll('mark.search-hit').length || 0;
    
    return (
      <div className="flex-shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-3 py-2">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              performSearch(e.target.value);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Find in story..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {matchCount > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {activeMatchIndex + 1}/{matchCount}
            </span>
          )}
          <button
            onClick={() => goToMatch(activeMatchIndex - 1)}
            className={btnClass}
            disabled={matchCount === 0}
            title="Previous match"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => goToMatch(activeMatchIndex + 1)}
            className={btnClass}
            disabled={matchCount === 0}
            title="Next match"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleSearchClose}
            className={btnClass}
            title="Close search"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

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

        {/* Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className={btnClass}
          title="Search in story"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Find</span>
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

        {/* Time Left */}
        {totalWords > 0 && progressPct < 0.98 && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>~{minutesLeft} min left</span>
          </div>
        )}

        {/* TTS Controls */}
        {ttsSupported && (
          <div className="flex items-center gap-1 ml-auto">
            {/* Voice selector - only show when idle and narration voices exist */}
            {ttsState === 'idle' && narrationVoices.length > 0 && (
              <div className="hidden lg:block">
                <Select value={selectedVoiceName} onValueChange={handleVoiceChange}>
                  <SelectTrigger className="h-7 text-xs w-36 bg-secondary/80 border-0">
                    <SelectValue placeholder="Voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="auto" className="text-xs font-medium">
                      Recommended
                    </SelectItem>
                    {narrationVoices.slice(0, 10).map((v) => (
                      <SelectItem key={v.name} value={v.name} className="text-xs">
                        {formatVoiceName(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Speed control - show when idle or playing */}
            {(ttsState === 'idle' || ttsState === 'playing' || ttsState === 'paused') && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => handleRateChange(ttsRate - 0.1)}
                  className={btnClass}
                  title="Slower"
                  disabled={ttsRate <= 0.5}
                >
                  <Minus size={10} />
                </button>
                <span className="text-xs text-muted-foreground w-10 text-center font-mono">
                  {ttsRate.toFixed(1)}x
                </span>
                <button
                  onClick={() => handleRateChange(ttsRate + 0.1)}
                  className={btnClass}
                  title="Faster"
                  disabled={ttsRate >= 1.5}
                >
                  <Plus size={10} />
                </button>
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

      {/* Voice quality hint - only show on desktop */}
      {ttsSupported && ttsState === 'idle' && (
        <div className="hidden md:block px-3 pb-1.5 -mt-0.5">
          <p className="text-[10px] text-muted-foreground/50">
            Tip: Edge or Safari often have the best narrator voices
          </p>
        </div>
      )}
    </div>
  );
}
