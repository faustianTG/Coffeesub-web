'use client'

import { useState } from 'react'
import { signUp } from '../../lib/auth'
import { createCustomerWithQRCode } from '../../services/customerService'
import { supabase } from '../../lib/supabaseClient'

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Waits until the session is fully established in Supabase Auth
  // before proceeding to insert into customers (which has a FK to auth.users)
  const waitForSession = async (maxAttempts = 10): Promise<string> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) return session.user.id
      // Wait 300ms between attempts
      await new Promise((res) => setTimeout(res, 300))
    }
    throw new Error('Session not established after sign up. Please try signing in.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.full_name || !form.email || !form.password) {
      setError('Full name, email, and password are required.')
      return
    }

    setLoading(true)
    try {
      // Step 1: Create auth user
      await signUp(form.email, form.password)

      // Step 2: Wait until the session is fully committed in auth.users
      // before inserting into customers (foreign key constraint)
      const userId = await waitForSession()

      // Step 3: Create customers row + generate & link QR code
      await createCustomerWithQRCode(
        userId,
        form.full_name,
        form.phone_number ?? '',
        form.email
      )

      // Step 4: Hard redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">☕</div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: '#1C0A00' }}
          >
            Join CoffeeSub
          </h1>
          <p style={{ color: '#6B3F1A' }} className="text-sm">
            Create your account to start your coffee journey
          </p>
        </div>

        <div className="coffee-card p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="coffee-label">Full Name</label>
              <input
                name="full_name"
                type="text"
                className="coffee-input"
                placeholder="Your full name"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="coffee-label">Email Address</label>
              <input
                name="email"
                type="email"
                className="coffee-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="coffee-label">
                Phone Number{' '}
                <span className="opacity-50 normal-case font-normal">(optional)</span>
              </label>
              <input
                name="phone_number"
                type="tel"
                className="coffee-input"
                placeholder="+60 12 345 6789"
                value={form.phone_number}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="coffee-label">Password</label>
              <input
                name="password"
                type="password"
                className="coffee-input"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="coffee-btn-primary w-full mt-2"
              style={{ fontSize: '1rem' }}
            >
              {loading ? 'Setting up your account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#6B3F1A' }}>
            Already have an account?{' '}
            <a href="/login" className="font-semibold underline" style={{ color: '#3B1A08' }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
