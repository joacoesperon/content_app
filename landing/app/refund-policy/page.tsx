import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund Policy for the Jess Trading XAUUSD bot.',
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="June 8, 2026">
      <p>
        We&rsquo;d rather lose a sale than create an unhappy customer. Every purchase comes with a{' '}
        <strong>14-day refund window, no questions asked</strong>.
      </p>

      <h2>1. The 14-day window</h2>
      <p>
        You have 14 days from the date of purchase to request a full refund for any reason. Try the
        bot on a small or demo account, judge it for yourself, and if it&rsquo;s not for you, get
        your money back.
      </p>

      <h2>2. How to request a refund</h2>
      <p>
        Refunds are handled through Whop, our payment provider. Use the refund button inside your
        Whop dashboard, or email{' '}
        <a href="mailto:jesstradesinfobot@gmail.com">jesstradesinfobot@gmail.com</a> with the email
        you used at checkout and we&rsquo;ll take care of it.
      </p>

      <h2>3. When the refund is processed</h2>
      <p>
        Approved refunds are issued to your original payment method. Processing time depends on Whop
        and your bank or card issuer, and typically takes a few business days.
      </p>

      <h2>4. After the window</h2>
      <p>
        Because the Product is a digital file delivered instantly, purchases are non-refundable after
        the 14-day window has passed.
      </p>

      <h2>5. Abuse</h2>
      <p>
        The refund window is offered in good faith. We reserve the right to decline refunds where we
        detect abuse — for example, repeated buy-and-refund cycles or evidence that the .ex5 file has
        been redistributed in violation of our{' '}
        <a href="/terms">Terms of Service</a>.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about a refund? Email{' '}
        <a href="mailto:jesstradesinfobot@gmail.com">jesstradesinfobot@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
