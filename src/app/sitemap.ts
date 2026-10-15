import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const routes: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/boston-sweeper', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/food-inspections', priority: 0.8, changeFrequency: 'daily' },
  { path: '/trash-day', priority: 0.8, changeFrequency: 'weekly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
