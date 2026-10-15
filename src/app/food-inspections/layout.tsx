import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Food Inspections | Boston Hub',
  description: 'Search official Boston health inspection results. Each restaurant shows its latest real result, with older visits kept on the same card.',
  alternates: { canonical: '/food-inspections' },
  openGraph: {
    title: 'Food Inspections | Boston Hub',
    description: 'Search official Boston restaurant inspection results.',
    url: '/food-inspections',
  },
}

export default function FoodInspectionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
