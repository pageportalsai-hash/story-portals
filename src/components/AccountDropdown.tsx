import { User, BookOpen, History, Settings, CreditCard, LogOut, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface AccountDropdownProps {
  onSignOut: () => void;
}

const menuItems = [
  { icon: BookOpen, label: 'Continue Reading' },
  { icon: History, label: 'Read History' },
  { icon: Settings, label: 'Preferences' },
  { icon: CreditCard, label: 'Billing' },
];

export function AccountDropdown({ onSignOut }: AccountDropdownProps) {
  const isMobile = useIsMobile();

  const triggerButton = (
    <Button
      variant="ghost"
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
        <User size={14} className="text-primary" />
      </div>
      <span className="hidden sm:inline">Account</span>
    </Button>
  );

  // Mobile: Use Drawer (bottom sheet) with proper constraints
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent className="bg-card border-border max-h-[70svh] pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="relative">
            <DrawerTitle className="text-foreground">Account</DrawerTitle>
            <DrawerClose className="absolute right-4 top-4 rounded-full p-2 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <div className="flex flex-col space-y-1 mb-4">
              <p className="text-sm font-medium text-foreground">Guest User</p>
              <p className="text-xs text-muted-foreground">Sign in to sync your progress</p>
            </div>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4">
              <button
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                onClick={onSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use DropdownMenu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">Guest User</p>
            <p className="text-xs text-muted-foreground">Sign in to sync your progress</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.label} className="cursor-pointer focus:bg-muted/50 focus:text-foreground">
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          className="cursor-pointer focus:bg-destructive/10 focus:text-destructive text-destructive"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
