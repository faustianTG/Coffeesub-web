'use client'

import { useRouter, usePathname } from 'next/navigation'
import { signOut } from '../lib/auth'
import { useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.push('/login')
    } catch {
      setSigningOut(false)
    }
  }

  const navLinks = [
    { href: '/dashboard', label: 'My Card' },
    { href: '/profile', label: 'Profile' },
  ]

  return (
    <nav className="sticky top-0 z-50" style={{ background: 'rgba(28,10,0,0.97)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">☕</span>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#C68642' }}
          >
            CoffeeSub
          </span>
        </a>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-caramel text-espresso'
                  : 'text-steam hover:text-cream hover:bg-white/10'
              }`}
              style={
                pathname === link.href
                  ? { background: '#C68642', color: '#1C0A00' }
                  : { color: '#E8D5B7' }
              }
            >
              {link.label}
            </a>
          ))}

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#E8D5B7', border: '1px solid rgba(232,213,183,0.3)' }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </nav>
  )
}
