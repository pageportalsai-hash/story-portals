import { Link } from 'react-router-dom';
import { BookOpen, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="px-4 md:px-12 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen size={20} className="text-primary" />
            <span className="font-display text-lg font-semibold">PagePortals</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Library
            </Link>
            <Link
              to="/add"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Add Story
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github size={18} />
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PagePortals. All stories belong to their authors.
          </p>
        </div>
      </div>
    </footer>
  );
}
