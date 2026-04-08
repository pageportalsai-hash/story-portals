import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { StoryMeta } from '@/types/story';
import { useEffect, useState } from 'react';

interface HeaderProps {
  stories: StoryMeta[];
  showSearch?: boolean;
}

export function Header({ stories, showSearch = true }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Spacers */}
      <div className="w-full md:hidden h-[calc(env(safe-area-inset-top)+56px+48px)]" aria-hidden="true" />
      <div className="hidden md:block w-full h-[calc(env(safe-area-inset-top)+64px)]" aria-hidden="true" />

      <header
        className={`fixed top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top)] transition-all duration-500 ${
          scrolled
            ? 'bg-background/70 backdrop-blur-xl border-b border-border/30 shadow-lg shadow-background/20'
            : 'bg-gradient-to-b from-background/80 via-background/40 to-transparent'
        }`}
      >
        {/* Main header bar */}
        <div className="flex items-center justify-between px-4 md:px-12 h-14 md:h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors group"
          >
            <div className="relative">
              <BookOpen size={28} className="text-primary transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 blur-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-tight">
              PagePortals
            </span>
          </Link>

          {/* Search (Desktop) */}
          {showSearch && (
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar stories={stories} />
            </div>
          )}

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <span className="text-xs text-muted-foreground/60 bg-muted/30 px-2.5 py-1 rounded-full">
              {stories.length} stories
            </span>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden px-4 pb-3 h-12">
            <SearchBar stories={stories} />
          </div>
        )}
      </header>
    </>
  );
}
