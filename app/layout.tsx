import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoffeeSub — Coffee Subscription',
  description: 'Your premium coffee subscription, always in your pocket.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: 'linear-gradient(160deg, #FDF6EC 0%, #F5ECD7 60%, #E8D5B7 100%)' }}>
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  )
}
