import { supabase } from '../lib/supabaseClient'
import { Redemption } from '../types'

export async function getUserRedemptions(customerId: string): Promise<Redemption[]> {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*')
    .eq('customer_id', customerId)
    .order('redeemed_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch redemptions: ${error.message}`)
  return (data as Redemption[]) ?? []
}
