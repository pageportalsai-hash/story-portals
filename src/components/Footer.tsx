import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle } from 'lucide-react';

interface FooterProps {
  storyCount?: number;
}

export function Footer({ storyCount }: FooterProps) {
  return (
    <footer className="bg-card/20 border-t border-border/30 pb-[calc(var(--ad-slot-h)+8px)]">
      <div className="px-4 md:px-12 py-4 md:py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen size={16} className="text-primary" />
              <span className="font-display text-sm font-semibold">PagePortals</span>
            </Link>

            {/* Quick Links */}
            <nav className="flex items-center gap-4 text-xs">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Library
              </Link>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="How it works"
              >
                <HelpCircle size={12} />
                <span>About</span>
              </button>
            </nav>

            {/* Stats + Copyright */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {storyCount && storyCount > 0 && (
                <span>
                  <span className="text-foreground/80">{storyCount}</span> stories
                </span>
              )}
              <span className="text-muted-foreground/50">•</span>
              <span className="text-muted-foreground/70">
                © {new Date().getFullYear()} PagePortals
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
