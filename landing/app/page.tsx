import { Hero } from '@/components/sections/hero';
import { LivePerformance } from '@/components/sections/live-performance';
import { WhoFor } from '@/components/sections/who-for';
import { HowItWorks } from '@/components/sections/how-it-works';
import { OfferStack } from '@/components/sections/offer-stack';
import { BacktestProof } from '@/components/sections/backtest-proof';
import { Testimonials } from '@/components/sections/testimonials';
import { FAQ } from '@/components/sections/faq';
import { FinalCTA } from '@/components/sections/final-cta';
import { Footer } from '@/components/sections/footer';

export default function HomePage() {
  return (
    <>
      <main className="relative">
        <Hero />
        <LivePerformance />
        <WhoFor />
        <HowItWorks />
        <OfferStack />
        <BacktestProof />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
