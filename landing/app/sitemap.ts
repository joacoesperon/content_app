import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jesstrading.xyz';

export default function sitemap(): MetadataRoute.Sitemap {
  const legalRoutes = ['/terms', '/privacy', '/refund-policy', '/risk-disclosure'];
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...legalRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];
}
