'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';
import { trackEvent, generateEventId } from '@/lib/pixel';

const WHOP_URL = 'https://whop.com/joined/jesstrading/';
const PRODUCT_ID = 'jess-trading-bot';
const PRODUCT_NAME = 'Jess Trading XAUUSD Bot';
const PRODUCT_PRICE = 147;

interface CheckoutButtonProps {
  children: React.ReactNode;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  className?: string;
  showArrow?: boolean;
}

/**
 * Primary "Buy" CTA. Fires Pixel `InitiateCheckout` event then redirects to Whop.
 * The actual `Purchase` event is fired server-side from the Whop webhook (CAPI).
 */
export function CheckoutButton({
  children,
  size = 'md',
  variant = 'primary',
  className,
  showArrow = true,
}: CheckoutButtonProps) {
  const handleClick = () => {
    const eventId = generateEventId();
    trackEvent(
      'InitiateCheckout',
      {
        value: PRODUCT_PRICE,
        currency: 'USD',
        content_ids: [PRODUCT_ID],
        content_name: PRODUCT_NAME,
        content_type: 'product',
      },
      eventId,
    );
  };

  return (
    <a
      href={WHOP_URL}
      target="_blank"
      rel="noopener"
      onClick={handleClick}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
      {showArrow && <ArrowRight className="h-4 w-4" />}
    </a>
  );
}
