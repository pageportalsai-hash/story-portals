import { User, BookOpen, History, Settings, CreditCard, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface AccountDropdownProps {
  onSignOut: () => void;
}

export function AccountDropdown({ onSignOut }: AccountDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <span className="hidden sm:inline">Account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">Guest User</p>
            <p className="text-xs text-muted-foreground">Sign in to sync your progress</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem className="cursor-pointer focus:bg-muted/50 focus:text-foreground">
          <BookOpen className="mr-2 h-4 w-4" />
          <span>Continue Reading</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer focus:bg-muted/50 focus:text-foreground">
          <History className="mr-2 h-4 w-4" />
          <span>Read History</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer focus:bg-muted/50 focus:text-foreground">
          <Settings className="mr-2 h-4 w-4" />
          <span>Preferences</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer focus:bg-muted/50 focus:text-foreground">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>
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
