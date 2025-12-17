import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for casual exploration',
      features: [
        'Browse all story covers',
        'Read story previews & synopses',
        '3 full story reads per month',
        'Local reading progress',
      ],
      cta: 'Current Plan',
      disabled: true,
      highlight: false,
    },
    {
      name: 'Premium',
      price: '$3',
      period: '/month',
      description: 'Unlimited access to all portals',
      features: [
        'Everything in Free',
        'Unlimited full story reads',
        'Early access to new releases',
        'Cross-device sync (coming soon)',
        'Exclusive premium stories',
      ],
      cta: 'Coming Soon',
      disabled: true,
      highlight: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">Choose Your Portal Pass</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Simple pricing for unlimited machine-crafted stories
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl p-6 transition-all ${
                tier.highlight
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-muted/30 border border-border'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                  <Sparkles size={12} />
                  Recommended
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="font-display text-xl font-bold text-foreground">{tier.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={16} className={`flex-shrink-0 mt-0.5 ${tier.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={tier.highlight ? 'default' : 'secondary'}
                disabled={tier.disabled}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Premium subscriptions are coming in Phase 2. All features are currently simulated for demonstration.
        </p>
      </DialogContent>
    </Dialog>
  );
}
