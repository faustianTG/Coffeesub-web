import { supabase } from '../lib/supabaseClient'
import { generateUniqueQRCode } from '../lib/qr'
import { WebCustomer } from '../types'

export async function createCustomerWithQRCode(
  userId: string,
  fullName: string,
  phoneNumber: string,
  email: string
): Promise<WebCustomer> {
  // Step 1: Generate unique QR code and insert into qr_codes table
  const qrCode = await generateUniqueQRCode()

  // Step 2: Insert into customers with all fields
  const { data, error } = await supabase
    .from('customers')
    .insert({
      full_name: fullName,
      phone_number: phoneNumber,
      email: email,
      qr_code: qrCode,
      created_by_user_id: userId,
      subscription_plan_id: null,
      subscription_expires_at: null,
      claim_balance: null,
      claimed_coffee: null,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create customer: ${error.message}`)
  return data as WebCustomer
}

export async function getCustomerByUserId(userId: string): Promise<WebCustomer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('created_by_user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch customer: ${error.message}`)
  return data as WebCustomer | null
}

export async function getCustomerWithPlan(userId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      subscription_plans (
        id,
        name,
        claim_balance,
        duration_days
      )
    `)
    .eq('created_by_user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch customer with plan: ${error.message}`)
  return data
}
