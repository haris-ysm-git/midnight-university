import { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://midnight-university.vercel.app';

  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/article/${article.id}`,
    lastModified: new Date(article.frontmatter.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/index-az`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/graph`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...articleUrls,
  ];
}
