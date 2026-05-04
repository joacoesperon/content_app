import { Quote } from 'lucide-react';

// TODO: replace placeholders with real testimonials once collected from beta users
type Testimonial = {
  quote: string;
  author: string;
  role: string;
  handle?: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I traded XAUUSD manually for 3 years. The bot has been live on my account for 47 days — same strategy I used to break under pressure, but executed perfectly. First consistent month I've had.",
    author: 'Marcus R.',
    role: 'Intermediate trader',
    handle: '@marcus_fx',
  },
  {
    quote:
      "I work full time. Bought it on a Sunday, set it up Monday morning before work. By Friday I had 6 closed trades — green week. Still doesn't feel real.",
    author: 'Daniel L.',
    role: 'Part-time trader',
    handle: '@dan_trades',
  },
  {
    quote:
      "I'm not a trader — I run an online business. Wanted exposure to gold without learning charts. The setup video was 8 minutes. It's been running 3 weeks and I check it once a day.",
    author: 'Sofía M.',
    role: 'Passive investor',
  },
];

export function Testimonials() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight text-ink-primary md:text-5xl">
            What early users are saying.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <Quote className="mb-4 h-6 w-6 text-neon-bright/60" />
              <p className="flex-1 text-sm leading-relaxed text-ink-primary">"{t.quote}"</p>
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="text-sm font-semibold text-ink-primary">{t.author}</div>
                <div className="text-xs text-ink-muted">
                  {t.role}
                  {t.handle && <span className="ml-2 text-ink-muted/60">· {t.handle}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted/70">
          Testimonials reflect individual experiences. Trading results vary and depend on capital,
          broker, and market conditions.
        </p>
      </div>
    </section>
  );
}
