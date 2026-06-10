'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { encryptQRCode } from '../lib/encryption'

interface QRCodeDisplayProps {
  value: string
  size?: number
}

export default function QRCodeDisplay({ value, size = 220 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canvasRef.current || !value) return

    const render = async () => {
      try {
        // Encrypt the raw UUID from the database before rendering.
        // The QR code encodes the encrypted string — so when a scanner
        // reads it, it receives the AES-encrypted value, not the raw UUID.
        const encryptedValue = await encryptQRCode(value)

        QRCode.toCanvas(canvasRef.current!, encryptedValue, {
          width: size,
          margin: 2,
          color: {
            dark: '#1C0A00',
            light: '#FDF6EC',
          },
        })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to render QR code.')
      }
    }

    render()
  }, [value, size])

  if (error) {
    return (
      <div className="flex items-center justify-center text-sm text-red-600" style={{ width: size, height: size }}>
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="p-4 rounded-2xl"
        style={{
          background: '#FDF6EC',
          boxShadow: '0 8px 40px rgba(28,10,0,0.18), 0 0 0 6px rgba(198,134,66,0.15)',
        }}
      >
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>
      <p className="mt-3 text-xs font-mono tracking-widest opacity-40 select-all" style={{ color: '#6B3F1A' }}>
        
      </p>
    </div>
  )
}
