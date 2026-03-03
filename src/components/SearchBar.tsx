import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StoryMeta } from '@/types/story';

const BASE_PATH = import.meta.env.BASE_URL || '/';

interface SearchBarProps {
  stories: StoryMeta[];
}

export function SearchBar({ stories }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<StoryMeta[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = stories.filter(
      (story) =>
        story.title.toLowerCase().includes(searchTerm) ||
        story.genre.toLowerCase().includes(searchTerm) ||
        story.synopsis.toLowerCase().includes(searchTerm) ||
        story.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
    setResults(filtered.slice(0, 6));
    setSelectedIndex(-1);
  }, [query, stories]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      navigate(`/story/${results[selectedIndex].slug}`);
      setIsOpen(false);
      setQuery('');
    }
  }, [results, selectedIndex, navigate]);

  const getImagePath = (story: StoryMeta) => {
    return story.posterImage.startsWith('/')
      ? `${BASE_PATH}${story.posterImage.slice(1)}`
      : `${BASE_PATH}stories/${story.slug}/${story.posterImage}`;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stories..."
          className="w-full bg-foreground/5 border border-foreground/10 rounded-full px-4 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/30 focus:bg-foreground/8 transition-all duration-200 backdrop-blur-sm"
          aria-label="Search stories"
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center text-[10px] text-muted-foreground/40 bg-foreground/5 border border-foreground/10 rounded px-1.5 py-0.5 font-mono">
            /
          </kbd>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-background/50 overflow-hidden z-50 animate-scale-in">
          {results.length > 0 ? (
            <ul className="py-1.5">
              {results.map((story, index) => (
                <li key={story.slug}>
                  <Link
                    to={`/story/${story.slug}`}
                    onClick={() => { setIsOpen(false); setQuery(''); }}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary/10 text-foreground'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-8 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={getImagePath(story)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {story.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {story.genre}
                        {story.readingTimeMins && ` • ${story.readingTimeMins} min`}
                      </p>
                    </div>
                    {index === selectedIndex && (
                      <ArrowRight size={14} className="text-primary flex-shrink-0" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No stories found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
