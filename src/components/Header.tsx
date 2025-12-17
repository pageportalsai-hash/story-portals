import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, LogIn } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { AuthModal } from './AuthModal';
import { AccountDropdown } from './AccountDropdown';
import { useUserState } from '@/hooks/useUserState';
import { StoryMeta } from '@/types/story';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  stories: StoryMeta[];
  showSearch?: boolean;
}

export function Header({ stories, showSearch = true }: HeaderProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isGuest, signInAsGuest, signOut } = useUserState();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="flex items-center justify-between px-4 md:px-12 py-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <BookOpen size={28} className="text-primary" />
            <span className="font-display text-xl md:text-2xl font-bold">
              PagePortals
            </span>
          </Link>

          {/* Search (Desktop) */}
          {showSearch && (
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar stories={stories} />
            </div>
          )}

          {/* Nav */}
          <nav className="flex items-center gap-4">
            {isGuest ? (
              <AccountDropdown onSignOut={signOut} />
            ) : (
              <Button
                variant="ghost"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
          </nav>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden px-4 pb-4">
            <SearchBar stories={stories} />
          </div>
        )}
      </header>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onGuestSignIn={signInAsGuest}
      />
    </>
  );
}
