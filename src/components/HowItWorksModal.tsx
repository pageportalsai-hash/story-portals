import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Library, BookOpen, Settings, Save, Volume2, LayoutGrid } from 'lucide-react';

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
      description: 'Enjoy a clean reading experience with adjustable font sizes, dark/paper themes, and focus mode for distraction-free reading.',
    },
    {
      icon: Save,
      title: 'Progress Saved Locally',
      description: 'Your reading progress is automatically saved in your browser. Pick up exactly where you left off, even after closing the tab.',
    },
    {
      icon: Volume2,
      title: 'Read to Me',
      description: 'Use the "Read to me" feature on story pages to have the text read aloud. Your audio position is saved so you can resume listening anytime.',
    },
    {
      icon: LayoutGrid,
      title: 'About Ads',
      description: 'You may see ads in the reserved space at the bottom of pages. This helps keep PagePortals free for everyone.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">How PagePortals Works</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your guide to exploring machine-generated fiction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 p-3 rounded-lg transition-colors hover:bg-muted/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <feature.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {feature.title}
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
