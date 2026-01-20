import { Link } from 'react-router-dom';
import { BookOpen, Github, Mail, HelpCircle } from 'lucide-react';

interface FooterProps {
  storyCount?: number;
}

export function Footer({ storyCount }: FooterProps) {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="px-4 md:px-12 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen size={18} className="text-primary" />
              <span className="font-display text-base font-semibold">PagePortals</span>
            </Link>

            {/* Quick Links */}
            <nav className="flex items-center gap-4 text-sm">
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
                <HelpCircle size={14} />
                <span className="hidden sm:inline">About</span>
              </button>
            </nav>

            {/* Stats + Copyright */}
            <div className="flex flex-col items-center md:items-end gap-1">
              {storyCount && storyCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">{storyCount}</span> stories in the library
                </p>
              )}
              <p className="text-xs text-muted-foreground/70">
                © {new Date().getFullYear()} PagePortals
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
