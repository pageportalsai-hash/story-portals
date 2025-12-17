import { useState } from 'react';
import { Settings, X, Type, AlignJustify, Moon, Sun, Focus, PlayCircle } from 'lucide-react';
import { ReaderSettings as ReaderSettingsType } from '@/hooks/useReaderSettings';

interface ReaderSettingsProps {
  settings: ReaderSettingsType;
  onUpdate: (updates: Partial<ReaderSettingsType>) => void;
}

export function ReaderSettings({ settings, onUpdate }: ReaderSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        aria-label="Reader settings"
      >
        <Settings size={16} />
        Reader Settings
      </button>

      {/* Settings Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-sm h-full bg-card border-l border-border shadow-xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Reader Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Type size={16} />
                  Font Size
                </div>
                <div className="flex gap-2">
                  {(['S', 'M', 'L'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdate({ fontSize: size })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        settings.fontSize === size
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Width */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlignJustify size={16} />
                  Line Width
                </div>
                <div className="flex gap-2">
                  {([
                    { value: 'narrow', label: 'Narrow' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'wide', label: 'Wide' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => onUpdate({ lineWidth: value })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        settings.lineWidth === value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  Theme
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdate({ theme: 'dark' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      settings.theme === 'dark'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Moon size={14} />
                    Dark
                  </button>
                  <button
                    onClick={() => onUpdate({ theme: 'paper' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      settings.theme === 'paper'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Sun size={14} />
                    Paper
                  </button>
                </div>
              </div>

              {/* Focus Mode */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Focus size={16} />
                  Focus Mode
                </div>
                <button
                  onClick={() => onUpdate({ focusMode: !settings.focusMode })}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    settings.focusMode
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {settings.focusMode ? 'On — Minimal Distractions' : 'Off — Full UI'}
                </button>
                <p className="text-xs text-muted-foreground">
                  Hides header, footer, and extra elements while reading.
                </p>
              </div>

              {/* Auto-scroll */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <PlayCircle size={16} />
                  Auto-scroll
                </div>
                <button
                  onClick={() => onUpdate({ autoScroll: !settings.autoScroll })}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    settings.autoScroll
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {settings.autoScroll ? 'Scrolling — Click to Stop' : 'Start Auto-scroll'}
                </button>

                {/* Speed Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Speed</span>
                    <span>{settings.autoScrollSpeed}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.autoScrollSpeed}
                    onChange={(e) => onUpdate({ autoScrollSpeed: Number(e.target.value) })}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
