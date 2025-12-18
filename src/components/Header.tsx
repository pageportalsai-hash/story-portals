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

  // Calculate header height for spacer: safe-area + main bar (56px) + mobile search (48px on mobile)
  const headerHeight = 'calc(env(safe-area-inset-top) + 56px + 48px)';
  const headerHeightDesktop = 'calc(env(safe-area-inset-top) + 64px)';

  return (
    <>
      {/* Spacer to prevent content from hiding under fixed header */}
      <div 
        className="w-full md:hidden" 
        style={{ height: headerHeight }} 
        aria-hidden="true" 
      />
      <div 
        className="hidden md:block w-full" 
        style={{ height: headerHeightDesktop }} 
        aria-hidden="true" 
      />

      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-background via-background/95 to-background/80 pt-[env(safe-area-inset-top)]">
        {/* Main header bar - fixed height */}
        <div className="flex items-center justify-between px-4 md:px-12 h-14 md:h-16">
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

        {/* Mobile Search - fixed height */}
        {showSearch && (
          <div className="md:hidden px-4 pb-3 h-12">
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
