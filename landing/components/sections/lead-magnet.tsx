import { FileDown } from 'lucide-react';
import { LeadMagnetForm } from '@/components/lead-magnet-form';

export function LeadMagnet() {
  return (
    <section id="lead-magnet" className="relative px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-ink-secondary">
          <FileDown className="h-3.5 w-3.5" />
          Free guide
        </div>
        <h2 className="text-balance text-2xl font-bold text-ink-primary md:text-3xl">
          5 Reasons Manual Traders Lose Money on Gold
          <span className="text-neon-bright"> (And the Mathematical Fix)</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-ink-secondary">
          Free PDF. No fluff. Read it in 10 minutes. If by page 3 you don't see yourself in there, delete it.
        </p>
        <LeadMagnetForm className="mt-6" />
        <p className="mt-3 text-xs text-ink-muted/60">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
