import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Library, BookOpen, Settings, Save, Sparkles } from 'lucide-react';

interface HowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HowItWorksModal({ open, onOpenChange }: HowItWorksModalProps) {
  const features = [
    {
      icon: Library,
      title: 'Browse the Library',
      description: 'Explore our collection of AI-generated novellas across sci-fi, fantasy, noir, and more. Each story is crafted by machine learning algorithms.',
    },
    {
      icon: BookOpen,
      title: 'Open a Portal',
      description: 'Click any cover to enter its world. Each poster is a gateway to a unique narrative experience—some beautiful, some terrifying, all fascinating.',
    },
    {
      icon: Settings,
      title: 'Reader Controls',
      description: 'Enjoy a clean reading experience with progress tracking, easy navigation between stories, and share links with friends.',
    },
    {
      icon: Save,
      title: 'Save Your Progress',
      description: 'Your reading progress is saved locally in your browser. Pick up exactly where you left off, even after closing the tab.',
    },
    {
      icon: Sparkles,
      title: 'Coming Soon: Accounts & More',
      description: 'Phase 2 will bring user accounts, cross-device sync, subscription tiers, and exclusive premium content. Stay tuned!',
      future: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">How PagePortals Works</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your guide to exploring machine-generated fiction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex gap-4 p-3 rounded-lg transition-colors ${
                feature.future ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                feature.future ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <feature.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {feature.title}
                  {feature.future && (
                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                      Future
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
