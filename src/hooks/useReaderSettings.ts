import { useState, useEffect, useCallback } from 'react';

export interface ReaderSettings {
  fontSize: 'S' | 'M' | 'L';
  lineWidth: 'narrow' | 'medium' | 'wide';
  theme: 'dark' | 'paper';
  focusMode: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number;
}

const STORAGE_KEY = 'pageportals_reader_settings';

const defaultSettings: ReaderSettings = {
  fontSize: 'M',
  lineWidth: 'medium',
  theme: 'dark',
  focusMode: false,
  autoScroll: false,
  autoScrollSpeed: 3,
};

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((updates: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // Auto-scroll logic is now handled in StoryPage where we have access to the reader pane ref

  // Get CSS classes based on settings
  const getReaderClasses = useCallback(() => {
    const classes: string[] = [];

    // Font size
    switch (settings.fontSize) {
      case 'S':
        classes.push('text-base');
        break;
      case 'M':
        classes.push('text-lg');
        break;
      case 'L':
        classes.push('text-xl');
        break;
    }

    // Line width
    switch (settings.lineWidth) {
      case 'narrow':
        classes.push('max-w-xl');
        break;
      case 'medium':
        classes.push('max-w-2xl');
        break;
      case 'wide':
        classes.push('max-w-3xl');
        break;
    }

    return classes.join(' ');
  }, [settings.fontSize, settings.lineWidth]);

  const getThemeClasses = useCallback(() => {
    if (settings.theme === 'paper') {
      return 'bg-amber-50 text-stone-800';
    }
    return 'bg-background text-foreground';
  }, [settings.theme]);

  return {
    settings,
    updateSettings,
    getReaderClasses,
    getThemeClasses,
  };
}
