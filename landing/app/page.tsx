import { Hero } from '@/components/sections/hero';
// Hidden until the real MyFXBook account has public history. Do NOT re-enable with placeholder/demo numbers.
// import { LivePerformance } from '@/components/sections/live-performance';
import { WhoFor } from '@/components/sections/who-for';
import { HowItWorks } from '@/components/sections/how-it-works';
import { OfferStack } from '@/components/sections/offer-stack';
// Hidden until real backtest numbers from the MT5 Strategy Tester reports replace the placeholders.
// import { BacktestProof } from '@/components/sections/backtest-proof';
import { Testimonials } from '@/components/sections/testimonials';
import { LeadMagnet } from '@/components/sections/lead-magnet';
import { FAQ } from '@/components/sections/faq';
import { FinalCTA } from '@/components/sections/final-cta';
import { Footer } from '@/components/sections/footer';

export default function HomePage() {
  return (
    <>
      <main className="relative">
        <Hero />
        {/* <LivePerformance /> — hidden until real MyFXBook data is public */}
        <WhoFor />
        <HowItWorks />
        <OfferStack />
        {/* <BacktestProof /> — hidden until real backtest numbers are plugged in */}
        <Testimonials />
        <LeadMagnet />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
