'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { getCustomerWithPlan } from '../../services/customerService'
import { getUserRedemptions } from '../../services/redemptionService'
import Navbar from '../../components/Navbar'
import { Redemption } from '../../types'
import { format, isPast, parseISO } from 'date-fns'

interface CustomerWithPlan {
  id: string
  full_name: string
  phone_number: string | null
  email: string | null
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

export default function ProfilePage() {
  const [customer, setCustomer] = useState<CustomerWithPlan | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
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
          setError('Your account profile could not be found. Please check your Supabase table and policies.')
          setLoading(false)
          return
        }
        setCustomer(data as CustomerWithPlan)

        const history = await getUserRedemptions(data.id)
        setRedemptions(history)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load profile.')
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
            <p style={{ color: '#6B3F1A' }} className="text-sm">Loading your profile…</p>
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
    : '—'

  const planName = customer.subscription_plans?.name ?? 'No active plan'
  const planBalance = customer.subscription_plans?.claim_balance ?? 0
  const remainingBalance = 
    (customer.claim_balance ?? 0) - (customer.claimed_coffee ?? 0);

  return (
    <>
      <Navbar />
      <main className="relative z-10 max-w-xl mx-auto px-4 py-10 space-y-6">
        <div className="animate-fade-up">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: '#1C0A00' }}
          >
            My Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B3F1A' }}>
            Your account details and subscription info
          </p>
        </div>

        {/* Personal info */}
        <div className="coffee-card p-6 animate-fade-up" style={{ animationDelay: '0.06s' }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C68642' }}>
            Personal Info
          </h2>
          <div className="space-y-3">
            <Row label="Full Name" value={customer.full_name} />
            <Row label="Email" value={customer.email || '—'} />
            <Row label="Phone" value={customer.phone_number || '—'} />
          </div>
        </div>

        {/* Subscription info */}
        <div className="coffee-card p-6 animate-fade-up" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C68642' }}>
              Subscription
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${isActive ? 'status-active' : 'status-expired'}`}
            >
              {isActive ? '● ACTIVE' : '● EXPIRED'}
            </span>
          </div>
          <div className="space-y-3">
            <Row label="Plan" value={planName} />
            <Row label="Plan Balance" value={`${planBalance} credits`} />
            <Row label="Remaining Credits" value={`${remainingBalance} credits`} />
            <Row label="Coffees Claimed" value={`${customer.claimed_coffee ?? 0}`} />
            <Row label="Expires On" value={expiryFormatted} />
          </div>
        </div>

        {/* Redemption history */}
        <div className="coffee-card p-6 animate-fade-up" id="history" style={{ animationDelay: '0.18s' }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C68642' }}>
            Redemption History
          </h2>

          {redemptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🫗</div>
              <p className="text-sm" style={{ color: '#6B3F1A' }}>
                No redemptions yet. Start enjoying your coffees!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {redemptions.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(198,134,66,0.07)' }}
                >
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>
                      {r.item_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B3F1A' }}>
                      {r.store_name}
                    </p>
                  </div>
                  <p className="text-xs font-medium" style={{ color: '#6B3F1A' }}>
                    {format(parseISO(r.redeemed_at), 'dd MMM yy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'rgba(198,134,66,0.15)' }}>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B3F1A' }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: '#1C0A00' }}>
        {value}
      </span>
    </div>
  )
}
