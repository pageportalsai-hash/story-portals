import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Type,
  Moon,
  Sun,
  Focus,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Minus,
  Plus,
} from 'lucide-react';
import { ReaderSettings } from '@/hooks/useReaderSettings';

interface TopReaderBarProps {
  settings: ReaderSettings;
  onUpdate: (updates: Partial<ReaderSettings>) => void;
  contentRef: React.RefObject<HTMLElement>;
}

export function TopReaderBar({ settings, onUpdate, contentRef }: TopReaderBarProps) {
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);

  // Check TTS support
  useEffect(() => {
    setTtsSupported('speechSynthesis' in window);
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Split text into chunks (~1000 chars) to avoid TTS failures
  const chunkText = useCallback((text: string): string[] => {
    const maxLen = 1000;
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLen && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += (current ? ' ' : '') + sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }, []);

  const speakChunk = useCallback((index: number) => {
    if (index >= chunksRef.current.length) {
      setTtsState('idle');
      currentChunkRef.current = 0;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunksRef.current[index]);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      currentChunkRef.current = index + 1;
      speakChunk(index + 1);
    };
    utterance.onerror = () => {
      setTtsState('idle');
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleTtsPlay = useCallback(() => {
    if (!ttsSupported) return;

    if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
      return;
    }

    // Get text from content
    const el = contentRef.current;
    if (!el) return;

    const text = el.textContent || '';
    if (!text.trim()) return;

    chunksRef.current = chunkText(text);
    currentChunkRef.current = 0;
    
    window.speechSynthesis.cancel();
    setTtsState('playing');
    speakChunk(0);
  }, [ttsSupported, ttsState, contentRef, chunkText, speakChunk]);

  const handleTtsPause = useCallback(() => {
    if (ttsState === 'playing') {
      window.speechSynthesis.pause();
      setTtsState('paused');
    }
  }, [ttsState]);

  const handleTtsStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setTtsState('idle');
    currentChunkRef.current = 0;
  }, []);

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
