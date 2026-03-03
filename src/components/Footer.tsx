import { Link } from 'react-router-dom';
import { BookOpen, Sparkles } from 'lucide-react';

interface FooterProps {
  storyCount?: number;
}

export function Footer({ storyCount }: FooterProps) {
  return (
    <footer className="relative border-t border-border/20 pb-[calc(var(--ad-slot-h)+8px)]">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.02] to-transparent pointer-events-none" />

      <div className="relative px-4 md:px-12 py-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <BookOpen size={20} className="text-primary" />
                <span className="font-display text-lg font-bold">PagePortals</span>
              </Link>
              <p className="text-xs text-muted-foreground/60 max-w-xs text-center md:text-left">
                AI-generated stories crafted by artificial minds. Every cover is a portal to another world.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              {storyCount && storyCount > 0 && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-display font-bold text-primary">{storyCount}</span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Stories</span>
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                <Sparkles size={24} className="text-primary/40" />
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">AI-Crafted</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-xs text-muted-foreground/40">
              © {new Date().getFullYear()} PagePortals
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
