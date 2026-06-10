'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { getCustomerWithPlan } from '../../services/customerService'
import Navbar from '../../components/Navbar'
import QRCodeDisplay from '../../components/QRCodeDisplay'
import { format, isPast, parseISO } from 'date-fns'

interface CustomerWithPlan {
  id: string
  full_name: string
  qr_code: string | null
  claim_balance: number | null
  claimed_coffee: number | null
  subscription_expires_at: string | null
  subscription_plans?: {
    id: string
    name: string
    claim_balance: number
    duration_days: number
  } | null
}

export default function DashboardPage() {
  const [customer, setCustomer] = useState<CustomerWithPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          window.location.href = '/login'
          return
        }

        const data = await getCustomerWithPlan(user.id)

        if (!data) {
          setError(
            'Your account profile could not be found. ' +
            'This usually means the customers table is empty or RLS is blocking the query. ' +
            'Please check your Supabase table and policies.'
          )
          setLoading(false)
          return
        }

        setCustomer(data as CustomerWithPlan)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex items-center justify-center min-h-[80vh] relative z-10">
          <div className="text-center">
            <div className="text-4xl animate-spin-slow mb-4">☕</div>
            <p style={{ color: '#6B3F1A' }} className="text-sm">Brewing your dashboard…</p>
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="flex items-center justify-center min-h-[80vh] relative z-10 px-4">
          <div className="coffee-card p-8 text-center max-w-md">
            <div className="text-3xl mb-4">⚠️</div>
            <p className="font-semibold mb-2" style={{ color: '#1C0A00' }}>Something went wrong</p>
            <p className="text-sm" style={{ color: '#6B3F1A' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="coffee-btn-primary mt-6 px-6 py-2 text-sm"
            >
              Try Again
            </button>
          </div>
        </main>
      </>
    )
  }

  if (!customer) return null

  const isActive = customer.subscription_expires_at
    ? !isPast(parseISO(customer.subscription_expires_at))
    : false

  const expiryFormatted = customer.subscription_expires_at
    ? format(parseISO(customer.subscription_expires_at), 'dd MMM yyyy')
    : 'No active plan'

  const planName = customer.subscription_plans?.name ?? 'No plan'
  const remainingBalance = 
    (customer.claim_balance ?? 0) - (customer.claimed_coffee ?? 0);

  return (
    <>
      <Navbar />
      <main className="relative z-10 max-w-xl mx-auto px-4 py-10 space-y-6">
        {/* Welcome */}
        <div className="text-center animate-fade-up">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: '#1C0A00' }}
          >
            Hello, {customer.full_name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B3F1A' }}>
            Your subscription card is ready to scan
          </p>
        </div>

        {/* QR Code Card */}
        <div className="coffee-card p-8 flex flex-col items-center animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <div className="flex items-center gap-2 mb-6 w-full justify-between">
            <span
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-display)', color: '#1C0A00' }}
            >
              CoffeeSub Card
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${isActive ? 'status-active' : 'status-expired'}`}
            >
              {isActive ? '● ACTIVE' : '● EXPIRED'}
            </span>
          </div>

          {customer.qr_code ? (
            <QRCodeDisplay value={customer.qr_code} size={220} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm" style={{ color: '#6B3F1A' }}>
              QR code not assigned yet. Please contact support.
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#C68642' }}>
              {planName}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.16s' }}>
          <div className="coffee-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#3B1A08' }}>
              {remainingBalance}
            </p>
            <p className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: '#6B3F1A' }}>
              Credits Left
            </p>
          </div>
          <div className="coffee-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#3B1A08' }}>
              {customer.claimed_coffee ?? 0}
            </p>
            <p className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: '#6B3F1A' }}>
              Coffees Claimed
            </p>
          </div>
          <div className="coffee-card p-4 text-center">
            <p className="text-sm font-bold leading-tight" style={{ color: '#3B1A08' }}>{expiryFormatted}</p>
            <p className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: '#6B3F1A' }}>
              Expires
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="coffee-card p-5 flex gap-3 animate-fade-up" style={{ animationDelay: '0.24s' }}>
          <a
            href="/profile"
            className="flex-1 text-center py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(198,134,66,0.12)', color: '#3B1A08' }}
          >
            View Profile
          </a>
          <a
            href="/profile#history"
            className="flex-1 text-center py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(198,134,66,0.12)', color: '#3B1A08' }}
          >
            Redemption History
          </a>
        </div>
      </main>
    </>
  )
}
