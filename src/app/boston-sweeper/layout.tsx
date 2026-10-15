import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boston Sweeper | Street Cleaning Schedule',
  description: 'Look up Boston street cleaning by block, side, and the next real sweeping date. No parking ticket guesswork.',
  alternates: { canonical: '/boston-sweeper' },
  openGraph: {
    title: 'Boston Sweeper | Street Cleaning Schedule',
    description: 'Next sweeping dates for Boston streets, from the official city schedule.',
    url: '/boston-sweeper',
  },
}

export default function BostonSweeperLayout({ children }: { children: React.ReactNode }) {
  return children
}
