export interface WebCustomer {
  id: string
  full_name: string
  phone_number: string | null
  email: string | null
  qr_code: string | null
  subscription_plan_id: string | null
  subscription_expires_at: string | null
  claim_balance: number | null
  claimed_coffee: number | null
  created_at: string
  updated_at: string
  created_by_user_id: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  claim_balance: number
  duration_days: number
}

export interface Redemption {
  customer_id: string
  store_name: string
  item_name: string
  redeemed_at: string
  redeemed_by_user_id: string
}

export interface Store {
  name: string
  is_active: boolean
}

export interface Item {
  item_name: string
  essential_plan: boolean
  unlimited_plan: boolean
  promo_plan: boolean
}

export interface AuthUser {
  id: string
  email?: string
  phone?: string
}

export interface RegisterFormData {
  full_name: string
  email: string
  phone_number: string
  password: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface DashboardData {
  customer: WebCustomer
  plan: SubscriptionPlan | null
  isActive: boolean
}
