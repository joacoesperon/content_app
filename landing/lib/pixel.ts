'use client';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

type PixelEventName =
  | 'PageView'
  | 'ViewContent'
  | 'InitiateCheckout'
  | 'Lead'
  | 'AddToCart'
  | 'Purchase';

type PixelEventParams = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  [key: string]: unknown;
};

export function trackEvent(
  eventName: PixelEventName,
  params: PixelEventParams = {},
  eventId?: string,
): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (eventId) {
    window.fbq('track', eventName, params, { eventID: eventId });
  } else {
    window.fbq('track', eventName, params);
  }
}

// Used to dedupe Pixel events with server-side CAPI events
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}
