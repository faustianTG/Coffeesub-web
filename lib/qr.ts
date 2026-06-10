import { supabase } from './supabaseClient'

export async function generateUniqueQRCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const rawUUID = crypto.randomUUID()

    // Check uniqueness of the raw UUID in qr_codes table
    const { data, error } = await supabase
      .from('qr_codes')
      .select('code')
      .eq('code', rawUUID)
      .maybeSingle()

    if (error) throw new Error(`QR uniqueness check failed: ${error.message}`)

    if (!data) {
      // Store the raw UUID as-is — no encryption in the database
      const { error: insertError } = await supabase
        .from('qr_codes')
        .insert({ 
          code: rawUUID,
          is_assigned: true
        })

      if (insertError) throw new Error(`QR code insertion failed: ${insertError.message}`)

      return rawUUID
    }

    attempts++
  }

  throw new Error('Failed to generate a unique QR code after multiple attempts.')
}
