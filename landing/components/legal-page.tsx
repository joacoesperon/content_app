import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-ink-primary md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: {updated}</p>

        <div className="legal-prose mt-10 space-y-6 text-ink-secondary">{children}</div>
      </div>
    </main>
  );
}
