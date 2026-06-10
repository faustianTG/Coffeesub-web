'use client'

import { useState } from 'react'
import { signIn } from '../../lib/auth'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      // Hard redirect — forces a full page load so the session cookie
      // is included in the request headers when middleware checks it
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please check your email and password.')
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
            Welcome to CoffeeSub Web
          </h1>
          <p className="text-sm" style={{ color: '#6B3F1A' }}>
            Sign in to access your coffeesub-scription
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
              <label className="coffee-label">Password</label>
              <input
                name="password"
                type="password"
                className="coffee-input"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="coffee-btn-primary w-full mt-2"
              style={{ fontSize: '1rem' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#6B3F1A' }}>
            New to CoffeeSub?{' '}
            <a href="/register" className="font-semibold underline" style={{ color: '#3B1A08' }}>
              Create an account
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
