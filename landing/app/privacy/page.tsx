import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Jess Trading.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 8, 2026">
      <p>
        This Privacy Policy explains what information Jess Trading collects, why we collect it, and
        how we handle it when you visit our website or purchase the Product.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Information you give us:</strong> your email address when you join our list or
          request the free guide, and the details required to complete a purchase.
        </li>
        <li>
          <strong>Purchase information:</strong> processed by our payment provider, Whop. We receive
          confirmation of your purchase and the email associated with it. We do not store your full
          card details — those are handled by Whop.
        </li>
        <li>
          <strong>Usage and device data:</strong> standard analytics and advertising data (pages
          visited, referrer, device and browser type) collected through cookies and tracking pixels.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To deliver the Product and provide setup support.</li>
        <li>To send you the free guide and occasional updates if you opted in.</li>
        <li>To measure and improve our marketing, including via the Meta (Facebook) Pixel and Conversions API.</li>
        <li>To detect fraud and enforce our Terms.</li>
      </ul>

      <h2>3. Cookies and tracking</h2>
      <p>
        We use cookies and the Meta Pixel to understand how visitors find and use the site and to
        measure ad performance. You can disable cookies in your browser settings; some site features
        may not work as intended if you do.
      </p>

      <h2>4. Third parties we share data with</h2>
      <p>
        We share data only with the service providers needed to run the business — for example, our
        payment processor (Whop), our email provider, and advertising/analytics platforms (Meta). We
        do not sell your personal information.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep your information for as long as needed to provide the Product and meet legal and
        accounting obligations, then delete or anonymize it.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data, and you can
        unsubscribe from emails at any time using the link in any message. To make a request, email{' '}
        <a href="mailto:jesstradesinfobot@gmail.com">jesstradesinfobot@gmail.com</a>.
      </p>

      <h2>7. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date
        above reflects the most recent revision.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about your privacy? Email{' '}
        <a href="mailto:jesstradesinfobot@gmail.com">jesstradesinfobot@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
