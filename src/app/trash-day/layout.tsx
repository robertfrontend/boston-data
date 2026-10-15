import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trash Day | Boston Hub',
  description: 'Find official trash and recycling pickup days for a Boston address.',
  alternates: { canonical: '/trash-day' },
  openGraph: {
    title: 'Trash Day | Boston Hub',
    description: 'Official trash and recycling days for Boston addresses.',
    url: '/trash-day',
  },
}

export default function TrashDayLayout({ children }: { children: React.ReactNode }) {
  return children
}
