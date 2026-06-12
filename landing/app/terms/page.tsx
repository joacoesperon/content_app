import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for the Jess Trading XAUUSD bot.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 8, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your purchase and use of the Jess
        Trading bot and related materials (the &ldquo;Product&rdquo;). By purchasing or using the
        Product, you agree to these Terms. If you do not agree, do not purchase or use the Product.
      </p>

      <h2>1. What you are buying</h2>
      <p>
        The Product is a software tool — an MetaTrader 5 (MT5) Expert Advisor (the
        &ldquo;.ex5&rdquo; file) that runs a range breakout strategy on XAUUSD and four major forex
        pairs — together with setup materials (a written guide, a video walkthrough, and
        pre-configured settings). Purchase grants you a non-exclusive, non-transferable lifetime
        license to use the Product on your own MetaTrader accounts, as described at checkout.
      </p>

      <h2>2. License and restrictions</h2>
      <ul>
        <li>The license is for your personal use. One license is tied to the account limit shown at checkout.</li>
        <li>You may not resell, redistribute, sublicense, share, or publish the .ex5 file or its settings.</li>
        <li>You may not decompile, reverse-engineer, or attempt to extract the underlying logic of the Product.</li>
        <li>Violation of these restrictions terminates your license without refund.</li>
      </ul>

      <h2>3. No financial advice</h2>
      <p>
        Jess Trading is not a broker, financial advisor, or registered investment firm. The Product
        is software that executes a rule-based strategy according to parameters you configure. It
        does not constitute investment, financial, tax, or legal advice. You alone are responsible
        for your trading decisions, your choice of broker, your capital allocation, and your risk
        settings. See our{' '}
        <a href="/risk-disclosure">Risk Disclosure</a> for the full risk warning.
      </p>

      <h2>4. No guarantee of results</h2>
      <p>
        Trading carries substantial risk of loss. Backtest results, demo accounts, and past
        performance are not indicative of future results. We make no representation or warranty that
        the Product will be profitable or will avoid losses. You use the Product at your own risk.
      </p>

      <h2>5. Payments and refunds</h2>
      <p>
        Payments are processed by our third-party provider, Whop. The price shown at checkout is a
        one-time payment unless stated otherwise. Refunds are governed by our{' '}
        <a href="/refund-policy">Refund Policy</a>.
      </p>

      <h2>6. Availability and updates</h2>
      <p>
        The Product you download is yours to keep. Updates, when available, are distributed through
        the private community channel. We do not guarantee that updates, support, or the community
        will be available indefinitely.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Jess Trading and its founder will not be liable for
        any trading losses, lost profits, or any indirect, incidental, consequential, or punitive
        damages arising from your use of the Product. Our total liability for any claim is limited to
        the amount you paid for the Product.
      </p>

      <h2>8. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Product after changes take
        effect constitutes acceptance of the revised Terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these Terms? Email{' '}
        <a href="mailto:jesstradesinfobot@gmail.com">jesstradesinfobot@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
