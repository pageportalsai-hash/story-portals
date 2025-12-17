import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StoryMeta } from '@/types/story';

interface SearchBarProps {
  stories: StoryMeta[];
}

export function SearchBar({ stories }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<StoryMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
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
  }, [query, stories]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stories, genres, tags..."
          className="search-input pl-11 pr-10"
          aria-label="Search stories"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-scale-in">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((story) => (
                <li key={story.slug}>
                  <Link
                    to={`/story/${story.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {story.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {story.genre} • {story.synopsis.slice(0, 50)}...
                      </p>
                    </div>
                    <span className="genre-chip text-xs">{story.genre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p>No stories found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
